ROADMAP_LEVELS = [
    {
        'id': 'start',
        'title': '0. Бастау',
        'subtitle': 'Тіл негізі және есеппен ойлау',
        'description': 'Оқушы есеп шартын оқуды, қарапайым код жазуды және күрделілікті түсінуді үйренеді.',
    },
    {
        'id': 'basic',
        'title': '1. Негізгі техникалар',
        'subtitle': 'Массивтер, жолдар, сұрыптау, префикстер',
        'description': '800-1200 рейтингтегі есептердің көбіне керек негіз.',
    },
    {
        'id': 'middle',
        'title': '2. Орта деңгей',
        'subtitle': 'Жадный алгоритмдер, бинарлық іздеу, графтар, DP',
        'description': '1200-1700 деңгейіндегі есептерді тұрақты шешуге көшу.',
    },
    {
        'id': 'advanced',
        'title': '3. Жоғары деңгей',
        'subtitle': 'Деректер құрылымдары, жолдар, күрделі графтар',
        'description': 'Олимпиада және 1700+ деңгейіндегі есептерге арналған тақырыптар.',
    },
]


ROADMAP_TOPICS = [
    {
        'id': 'syntax-io-complexity',
        'level': 'start',
        'order': 1,
        'title': 'Синтаксис, енгізу/шығару, күрделілік',
        'difficulty': 'Жеңіл',
        'estimated_hours': 4,
        'description': 'Шешімнің негізгі үлгісін, дерек типтерін, циклдерді, шарттарды және O(n) бағалауын меңгеру.',
        'topics': ['айнымалылар', 'if/else', 'for/while', 'енгізу/шығару', 'Big O'],
        'practice': ['A+B', 'максимум/минимум', 'жұптық', 'қарапайым симуляциялар'],
    },
    {
        'id': 'arrays-strings',
        'level': 'start',
        'order': 2,
        'title': 'Массивтер және жолдар',
        'difficulty': 'Жеңіл',
        'estimated_hours': 6,
        'description': 'Деректерді сақтауды, массивтерді өтуді және символдармен жұмыс істеуді үйрену.',
        'topics': ['массивтер', 'жолдар', 'санау', 'жиілік массиві', 'симуляция'],
        'practice': ['жиілікті санау', 'палиндром', 'символ ауыстыру', 'элемент іздеу'],
    },
    {
        'id': 'sorting-basic',
        'level': 'basic',
        'order': 3,
        'title': 'Сұрыптау және компараторлар',
        'difficulty': 'Жеңіл',
        'estimated_hours': 5,
        'description': 'Сұрыптау есепті қашан жеңілдететінін түсіну және жұптар/объектілерді сұрыптауды үйрену.',
        'topics': ['сұрыптау', 'өз компараторы', 'жұптар', 'тұрақты рет'],
        'practice': ['қатысушыларды сұрыптау', 'ең кіші айырма', 'оқиғаларды реттеу'],
    },
    {
        'id': 'prefix-sums',
        'level': 'basic',
        'order': 4,
        'title': 'Префикстік қосындылар',
        'difficulty': 'Жеңіл',
        'estimated_hours': 5,
        'description': 'Аралықтағы қосынды сұрауларына тез жауап беру және ішкі аралықтарды санау.',
        'topics': ['префикстік қосынды', 'аралық сұрау', 'жартылай қосындылар', '2D префикс'],
        'practice': ['аралық қосындысы', 'аралықтағы сан', 'матрица қосындысы'],
    },
    {
        'id': 'two-pointers',
        'level': 'basic',
        'order': 5,
        'title': 'Екі көрсеткіш және жылжымалы терезе',
        'difficulty': 'Орташа',
        'estimated_hours': 7,
        'description': 'Аралық, жұп және терезе есептерін O(n^2) орнына O(n) уақытта шешу.',
        'topics': ['екі көрсеткіш', 'жылжымалы терезе', 'сұрыпталған массивтер', 'ішкі массив'],
        'practice': ['қосындысы берілген жұп', 'ең ұзын аралық', 'қайталануды өшіру'],
    },
    {
        'id': 'sets-maps',
        'level': 'basic',
        'order': 6,
        'title': 'Set, map, unordered_map',
        'difficulty': 'Орташа',
        'estimated_hours': 6,
        'description': 'Жиілік, іздеу және бірегейлік үшін сөздіктер мен жиындарды қолдану.',
        'topics': ['set', 'map', 'hash map', 'жиілік', 'бірегей мәндер'],
        'practice': ['сөз жиілігі', 'бірегей сандар', 'алғашқы қайталану'],
    },
    {
        'id': 'math-number-theory',
        'level': 'middle',
        'order': 7,
        'title': 'Математика және сандар теориясы',
        'difficulty': 'Орташа',
        'estimated_hours': 9,
        'description': 'Негізгі олимпиадалық математиканы меңгеру: gcd, жай сандар, модуль.',
        'topics': ['ЕҮОБ/ЕКОЕ', 'жай сандар', 'елеуіш', 'модульдік арифметика', 'көбейткіштерге жіктеу'],
        'practice': ['ЕҮОБ/ЕКОЕ', 'Эратосфен елеуіші', 'жай бөлгіштер', 'қалдықтар'],
    },
    {
        'id': 'greedy',
        'level': 'middle',
        'order': 8,
        'title': 'Жадный алгоритмдер',
        'difficulty': 'Орташа',
        'estimated_hours': 8,
        'description': 'Локалды таңдауды дәлелдеуді және алмастыру аргументін көруді үйрену.',
        'topics': ['жадный таңдау', 'сұрыптау + жадный', 'аралықтар', 'алмастыру аргументі'],
        'practice': ['кесте', 'тиындар', 'аралықтар', 'құнды азайту'],
    },
    {
        'id': 'binary-search-answer',
        'level': 'middle',
        'order': 9,
        'title': 'Жауап бойынша бинарлық іздеу',
        'difficulty': 'Орташа',
        'estimated_hours': 8,
        'description': 'Монотонды тексеру арқылы минималды/максималды жауапты іздеу.',
        'topics': ['бинарлық іздеу', 'предикат', 'lower_bound', 'жауап іздеу'],
        'practice': ['ең аз уақыт', 'ең үлкен ұзындық', 'ресурсты бөлу'],
    },
    {
        'id': 'graphs-bfs-dfs',
        'level': 'middle',
        'order': 10,
        'title': 'Графтар: DFS және BFS',
        'difficulty': 'Орташа',
        'estimated_hours': 10,
        'description': 'Графты бейнелеу, компоненттерді аралау, салмақсыз графта қысқа жол табу.',
        'topics': ['графты сақтау', 'DFS', 'BFS', 'компоненттер', 'тор граф'],
        'practice': ['лабиринт', 'байланыс компоненттері', 'графтағы жол', 'аралдар'],
    },
    {
        'id': 'dynamic-programming-basic',
        'level': 'middle',
        'order': 11,
        'title': 'Динамикалық бағдарламалау: негіз',
        'difficulty': 'Қиын',
        'estimated_hours': 12,
        'description': 'Күйді, ауысуды, базаны және есептеу ретін түсіну.',
        'topics': ['1D DP', '2D DP', 'рюкзак', 'LIS', 'күй ауысуы'],
        'practice': ['баспалдақ', 'рюкзак', 'LIS', 'кестедегі жолдар'],
    },
    {
        'id': 'data-structures',
        'level': 'advanced',
        'order': 12,
        'title': 'Деректер құрылымдары',
        'difficulty': 'Қиын',
        'estimated_hours': 14,
        'description': 'Жылдам сұрау және жаңарту үшін деректер құрылымдарын қолдану.',
        'topics': ['stack', 'queue', 'deque', 'heap', 'Fenwick tree', 'segment tree'],
        'practice': ['терезедегі минимум', 'қосынды сұрауы', 'нүктені жаңарту', 'басымдықтар'],
    },
    {
        'id': 'shortest-paths-dsu',
        'level': 'advanced',
        'order': 13,
        'title': 'Қысқа жолдар, DSU, MST',
        'difficulty': 'Қиын',
        'estimated_hours': 12,
        'description': 'Салмақты графтарды шешу, компоненттерді біріктіру және минималды қаңқа құру.',
        'topics': ['Dijkstra', 'Bellman-Ford', 'DSU', 'Kruskal', 'MST'],
        'practice': ['жолдар', 'жол құны', 'минималды қаңқа', 'жиындарды біріктіру'],
    },
    {
        'id': 'string-algorithms',
        'level': 'advanced',
        'order': 14,
        'title': 'Жолдық алгоритмдер',
        'difficulty': 'Қиын',
        'estimated_hours': 12,
        'description': 'Ішкі жолдарды іздеу және жолдарды тиімді салыстыру.',
        'topics': ['hashing', 'KMP', 'Z-function', 'Trie', 'prefix function'],
        'practice': ['үлгі іздеу', 'қайталанулар', 'сөздер сөздігі', 'ішкі жолдарды салыстыру'],
    },
    {
        'id': 'advanced-dp-graphs',
        'level': 'advanced',
        'order': 15,
        'title': 'Жоғары деңгейлі DP және графтар',
        'difficulty': 'Өте қиын',
        'estimated_hours': 18,
        'description': 'Күшті олимпиадашыларға және жоғары рейтингті есептерге арналған тақырыптар.',
        'topics': ['bitmask DP', 'tree DP', 'SCC', 'topological sort', 'LCA', 'flows'],
        'practice': ['ішкі жиындар бойынша DP', 'ағаштар', 'күшті байланыс компоненттері', 'ағындар'],
    },
]


ROADMAP_RESOURCES = {
    'syntax-io-complexity': [
        {
            'kind': 'Құжаттама',
            'title': 'C++ reference',
            'url': 'https://en.cppreference.com/w/cpp',
            'source': 'cppreference',
        },
        {
            'kind': 'Практика',
            'title': 'Codeforces 800 implementation',
            'url': 'https://codeforces.com/problemset?tags=implementation,800-800',
            'source': 'Codeforces',
        },
    ],
    'arrays-strings': [
        {
            'kind': 'Мақала',
            'title': 'USACO Guide: Introduction to arrays',
            'url': 'https://usaco.guide/general/input-output?lang=cpp',
            'source': 'USACO Guide',
        },
        {
            'kind': 'Практика',
            'title': 'Strings and implementation есептері',
            'url': 'https://codeforces.com/problemset?tags=strings,800-1200',
            'source': 'Codeforces',
        },
    ],
    'sorting-basic': [
        {
            'kind': 'Мақала',
            'title': 'USACO Guide: sorting and custom comparators',
            'url': 'https://usaco.guide/silver/sorting-custom?lang=cpp',
            'source': 'USACO Guide',
        },
        {
            'kind': 'Практика',
            'title': 'Sorting есептері',
            'url': 'https://codeforces.com/problemset?tags=sortings,800-1200',
            'source': 'Codeforces',
        },
    ],
    'prefix-sums': [
        {
            'kind': 'Мақала',
            'title': 'Prefix sums',
            'url': 'https://usaco.guide/silver/prefix-sums?lang=cpp',
            'source': 'USACO Guide',
        },
        {
            'kind': 'Практика',
            'title': 'Prefix sums practice',
            'url': 'https://codeforces.com/problemset?tags=prefix%20sums,800-1300',
            'source': 'Codeforces',
        },
    ],
    'two-pointers': [
        {
            'kind': 'Мақала',
            'title': 'Two pointers method',
            'url': 'https://usaco.guide/silver/two-pointers?lang=cpp',
            'source': 'USACO Guide',
        },
        {
            'kind': 'Практика',
            'title': 'Two pointers practice',
            'url': 'https://codeforces.com/problemset?tags=two%20pointers,900-1500',
            'source': 'Codeforces',
        },
    ],
    'sets-maps': [
        {
            'kind': 'Құжаттама',
            'title': 'std::map және std::set',
            'url': 'https://en.cppreference.com/w/cpp/container',
            'source': 'cppreference',
        },
        {
            'kind': 'Практика',
            'title': 'Data structures practice',
            'url': 'https://codeforces.com/problemset?tags=data%20structures,800-1300',
            'source': 'Codeforces',
        },
    ],
    'math-number-theory': [
        {
            'kind': 'Мақала',
            'title': 'Number theory basics',
            'url': 'https://cp-algorithms.com/algebra/euclid-algorithm.html',
            'source': 'cp-algorithms',
        },
        {
            'kind': 'Практика',
            'title': 'Math practice',
            'url': 'https://codeforces.com/problemset?tags=math,900-1500',
            'source': 'Codeforces',
        },
    ],
    'greedy': [
        {
            'kind': 'Мақала',
            'title': 'Greedy algorithms',
            'url': 'https://usaco.guide/silver/greedy-sorting?lang=cpp',
            'source': 'USACO Guide',
        },
        {
            'kind': 'Практика',
            'title': 'Greedy practice',
            'url': 'https://codeforces.com/problemset?tags=greedy,800-1500',
            'source': 'Codeforces',
        },
    ],
    'binary-search-answer': [
        {
            'kind': 'Мақала',
            'title': 'Binary search',
            'url': 'https://cp-algorithms.com/num_methods/binary_search.html',
            'source': 'cp-algorithms',
        },
        {
            'kind': 'Практика',
            'title': 'Binary search practice',
            'url': 'https://codeforces.com/problemset?tags=binary%20search,900-1600',
            'source': 'Codeforces',
        },
    ],
    'graphs-bfs-dfs': [
        {
            'kind': 'Мақала',
            'title': 'Breadth-first search',
            'url': 'https://cp-algorithms.com/graph/breadth-first-search.html',
            'source': 'cp-algorithms',
        },
        {
            'kind': 'Құрал',
            'title': 'DFS/BFS visualization',
            'url': 'https://visualgo.net/en/dfsbfs',
            'source': 'VisuAlgo',
        },
    ],
    'dynamic-programming-basic': [
        {
            'kind': 'Мақала',
            'title': 'Introduction to DP',
            'url': 'https://cp-algorithms.com/dynamic_programming/intro-to-dp.html',
            'source': 'cp-algorithms',
        },
        {
            'kind': 'Практика',
            'title': 'DP practice',
            'url': 'https://codeforces.com/problemset?tags=dp,900-1600',
            'source': 'Codeforces',
        },
    ],
    'data-structures': [
        {
            'kind': 'Мақала',
            'title': 'Fenwick tree',
            'url': 'https://cp-algorithms.com/data_structures/fenwick.html',
            'source': 'cp-algorithms',
        },
        {
            'kind': 'Мақала',
            'title': 'Segment tree',
            'url': 'https://cp-algorithms.com/data_structures/segment_tree.html',
            'source': 'cp-algorithms',
        },
    ],
    'shortest-paths-dsu': [
        {
            'kind': 'Мақала',
            'title': 'Dijkstra algorithm',
            'url': 'https://cp-algorithms.com/graph/dijkstra.html',
            'source': 'cp-algorithms',
        },
        {
            'kind': 'Мақала',
            'title': 'Disjoint Set Union',
            'url': 'https://cp-algorithms.com/data_structures/disjoint_set_union.html',
            'source': 'cp-algorithms',
        },
    ],
    'string-algorithms': [
        {
            'kind': 'Мақала',
            'title': 'Prefix function and KMP',
            'url': 'https://cp-algorithms.com/string/prefix-function.html',
            'source': 'cp-algorithms',
        },
        {
            'kind': 'Мақала',
            'title': 'String hashing',
            'url': 'https://cp-algorithms.com/string/string-hashing.html',
            'source': 'cp-algorithms',
        },
    ],
    'advanced-dp-graphs': [
        {
            'kind': 'Мақала',
            'title': 'Strongly connected components',
            'url': 'https://cp-algorithms.com/graph/strongly-connected-components.html',
            'source': 'cp-algorithms',
        },
        {
            'kind': 'Мақала',
            'title': 'Lowest common ancestor',
            'url': 'https://cp-algorithms.com/graph/lca.html',
            'source': 'cp-algorithms',
        },
    ],
}


def roadmap_topics_with_resources():
    return [
        {
            **topic,
            'resources': ROADMAP_RESOURCES.get(topic['id'], []),
        }
        for topic in ROADMAP_TOPICS
    ]


def find_roadmap_topic(topic_id):
    topic = next((item for item in ROADMAP_TOPICS if item['id'] == topic_id), None)
    if not topic:
        return None
    return {
        **topic,
        'resources': ROADMAP_RESOURCES.get(topic['id'], []),
    }
