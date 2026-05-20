import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import UserRole

User = get_user_model()

class PresenceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = 'presence_all'

        if self.scope["user"].is_authenticated:
            # Join room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()
            await self.update_user_status(True, 'idle')
            await self.broadcast_status()
        else:
            await self.close()

    async def disconnect(self, close_code):
        if self.scope["user"].is_authenticated:
            await self.update_user_status(False, 'idle')
            await self.broadcast_status()
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')
        
        if action == 'update_pomodoro':
            status = data.get('status') # 'focus', 'break', 'idle'
            end_time = data.get('end_time')
            await self.update_user_pomodoro(status, end_time)
            await self.broadcast_status()

    @database_sync_to_async
    def update_user_status(self, is_online, status):
        User.objects.filter(id=self.scope["user"].id).update(
            is_online=is_online,
            pomodoro_status=status
        )

    @database_sync_to_async
    def update_user_pomodoro(self, status, end_time):
        User.objects.filter(id=self.scope["user"].id).update(
            pomodoro_status=status,
            pomodoro_end_time=end_time
        )

    async def broadcast_status(self):
        users_data = await self.get_active_users()
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'presence_message',
                'users': users_data
            }
        )

    @database_sync_to_async
    def get_active_users(self):
        current_user = self.scope["user"]
        users = User.objects.filter(is_online=True)
        if current_user.role != UserRole.SUPERUSER:
            users = users.filter(faction=current_user.faction)

        users = users.values(
            'id', 'username', 'faction', 'pomodoro_status', 'pomodoro_end_time'
        )
        return list(users)

    async def presence_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'presence_update',
            'users': event['users']
        }))
