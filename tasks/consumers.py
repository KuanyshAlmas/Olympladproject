import json
from channels.generic.websocket import AsyncWebsocketConsumer
from core.models import UserRole

class TaskConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]
        self.faction = self.scope['url_route']['kwargs']['faction']
        self.room_group_name = f'tasks_{self.faction}'

        if not user.is_authenticated:
            await self.close()
            return

        if user.role != UserRole.SUPERUSER and user.faction != self.faction:
            await self.close()
            return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'task_message',
                'message': message
            }
        )

    # Receive message from room group
    async def task_message(self, event):
        message = event['message']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message
        }))
