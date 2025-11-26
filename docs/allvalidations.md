locations

{
  $jsonSchema: {
    bsonType: 'object',
    required: [
      'name',
      'type'
    ],
    properties: {
      name: {
        bsonType: 'string',
        minLength: 2,
        maxLength: 100,
        description: 'Название локации'
      },
      type: {
        'enum': [
          'city',
          'category'
        ],
        description: 'Тип локации'
      },
      icon: {
        bsonType: [
          'string',
          'null'
        ],
        maxLength: 2,
        description: 'Эмодзи/иконка локации'
      },
      adsCount: {
        bsonType: [
          'int',
          'null'
        ],
        minimum: 0,
        description: 'Количество объявлений'
      },
      createdAt: {
        bsonType: [
          'date',
          'null'
        ],
        description: 'Дата создания'
      },
      updatedAt: {
        bsonType: [
          'date',
          'null'
        ],
        description: 'Дата обновления'
      }
    },
    additionalProperties: true
  }
}




ads

{
  $jsonSchema: {
    bsonType: 'object',
    required: [
      'title',
      'category',
      'description',
      'price',
      'location',
      'userId'
    ],
    properties: {
      title: {
        bsonType: 'string',
        minLength: 10,
        maxLength: 100
      },
      category: {
        bsonType: 'string',
        'enum': [
          'Инструменты',
          'Студии',
          'DJ оборудование',
          'Клавишные',
          'Микрофоны',
          'Аудио'
        ]
      },
      description: {
        bsonType: 'string',
        minLength: 50,
        maxLength: 2000
      },
      price: {
        bsonType: 'string',
        pattern: '^\\d+(\\s*₸)?\\s*\\/\\s*(час|день|неделя|месяц)$'
      },
      location: {
        bsonType: 'string',
        minLength: 2,
        maxLength: 50
      },
      images: {
        bsonType: [
          'array',
          'null'
        ],
        items: {
          bsonType: 'string'
        },
        minItems: 0,
        maxItems: 10
      },
      userId: {
        bsonType: 'objectId'
      },
      views: {
        bsonType: 'int',
        minimum: 0
      },
      status: {
        bsonType: 'string',
        'enum': [
          'active',
          'inactive',
          'sold',
          'pending',
          'rejected'
        ]
      },
      featured: {
        bsonType: 'bool'
      },
      bookings: {
        bsonType: 'array',
        items: {
          bsonType: 'object',
          required: [
            'renterId',
            'startDate',
            'endDate',
            'period',
            'price'
          ],
          properties: {
            renterId: {
              bsonType: 'objectId'
            },
            startDate: {
              bsonType: 'date'
            },
            endDate: {
              bsonType: 'date'
            },
            startTime: {
              bsonType: [
                'date',
                'null'
              ]
            },
            endTime: {
              bsonType: [
                'date',
                'null'
              ]
            },
            period: {
              bsonType: 'string',
              'enum': [
                'hour',
                'day',
                'week',
                'month'
              ]
            },
            price: {
              bsonType: 'double',
              minimum: 0
            },
            status: {
              bsonType: 'string',
              'enum': [
                'pending',
                'approved',
                'rejected',
                'cancelled'
              ]
            },
            createdAt: {
              bsonType: [
                'date',
                'null'
              ]
            }
          },
          additionalProperties: true
        }
      },
      createdAt: {
        bsonType: [
          'date',
          'null'
        ]
      },
      updatedAt: {
        bsonType: [
          'date',
          'null'
        ]
      }
    },
    additionalProperties: true
  }
}






users

{
  $jsonSchema: {
    bsonType: 'object',
    required: [
      'name',
      'email'
    ],
    properties: {
      name: {
        bsonType: 'string',
        minLength: 2,
        maxLength: 50,
        pattern: '^[а-яА-ЯёЁa-zA-Z\\s]+$'
      },
      email: {
        bsonType: 'string',
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'
      },
      phone: {
        bsonType: [
          'string',
          'null'
        ],
        pattern: '^\\+?[1-9]\\d{1,14}$'
      },
      password: {
        bsonType: [
          'string',
          'null'
        ],
        minLength: 8
      },
      googleId: {
        bsonType: [
          'string',
          'null'
        ]
      },
      avatar: {
        bsonType: [
          'string',
          'null'
        ]
      },
      role: {
        bsonType: 'string',
        'enum': [
          'user',
          'admin',
          'moderator'
        ]
      },
      isBlocked: {
        bsonType: 'bool'
      },
      bio: {
        bsonType: [
          'string',
          'null'
        ],
        maxLength: 500
      },
      website: {
        bsonType: [
          'string',
          'null'
        ],
        pattern: '^https?://.+'
      },
      instagram: {
        bsonType: [
          'string',
          'null'
        ],
        pattern: '^[a-zA-Z0-9._]+$'
      },
      telegram: {
        bsonType: [
          'string',
          'null'
        ],
        pattern: '^[a-zA-Z0-9_]+$'
      },
      vk: {
        bsonType: [
          'string',
          'null'
        ],
        pattern: '^[a-zA-Z0-9._]+$'
      },
      youtube: {
        bsonType: [
          'string',
          'null'
        ],
        pattern: '^[a-zA-Z0-9._-]+$'
      },
      createdAt: {
        bsonType: [
          'date',
          'null'
        ]
      },
      updatedAt: {
        bsonType: [
          'date',
          'null'
        ]
      }
    },
    additionalProperties: true
  }
}






bookings 

{
  $jsonSchema: {
    bsonType: 'object',
    required: [
      'adId',
      'renterId',
      'ownerId',
      'startDate',
      'endDate',
      'periodType',
      'totalPrice'
    ],
    properties: {
      adId: {
        bsonType: 'objectId',
        description: 'ID объявления'
      },
      renterId: {
        bsonType: 'objectId',
        description: 'ID арендатора'
      },
      ownerId: {
        bsonType: 'objectId',
        description: 'ID владельца объявления'
      },
      startDate: {
        bsonType: 'date',
        description: 'Дата начала бронирования'
      },
      endDate: {
        bsonType: 'date',
        description: 'Дата окончания бронирования'
      },
      startTime: {
        bsonType: [
          'date',
          'null'
        ],
        description: 'Время начала бронирования (опционально)'
      },
      endTime: {
        bsonType: [
          'date',
          'null'
        ],
        description: 'Время окончания бронирования (опционально)'
      },
      periodType: {
        'enum': [
          'hour',
          'day',
          'week',
          'month'
        ],
        description: 'Тип периода бронирования'
      },
      totalPrice: {
        bsonType: [
          'double',
          'int'
        ],
        minimum: 0,
        description: 'Общая стоимость бронирования'
      },
      status: {
        'enum': [
          'pending',
          'confirmed',
          'cancelled',
          'completed'
        ],
        description: 'Статус бронирования'
      },
      createdAt: {
        bsonType: [
          'date',
          'null'
        ],
        description: 'Дата создания'
      },
      updatedAt: {
        bsonType: [
          'date',
          'null'
        ],
        description: 'Дата обновления'
      }
    },
    additionalProperties: true
  }
}