from ..models import HexTile, TileCategory, TileType, TileEffect, EffectTrigger

TilesB = {
  'BURG_VON_ALSPACH': HexTile(
    id='BURG_VON_ALSPACH',
    key='burg_von_alspach',
    name='Burg von Alspach',
    image='assets/tiles/B/burg_von_alspach.webp',
    category=TileCategory.RESIDENTIAL,
    type=None,
    cost=12,
    incomeChange=0,
    populationChange=3,
    reputationChange=0, 
    effects=[
      TileEffect(trigger=EffectTrigger.ADJACENT, target='Residential', reputation=1)
    ],
    description='+3 population. +1 reputation for each adjacent Residential.',
    isUnique=False,
    limit=2,
    set='Base'
  ),
  'CASINO': HexTile(
    id='CASINO',
    key='casino',
    name='Casino',
    image='assets/tiles/B/casino.webp',
    category=TileCategory.COMMERCIAL,
    type=None,
    cost=22,
    incomeChange=0,
    populationChange=0,
    reputationChange=-3, 
    effects=[
      TileEffect(trigger=EffectTrigger.INVESTMENT_LINE, income=1)
    ],
    description='-3 reputation. +1 income after you pass each investment line.',
    limit=1,
    isUnique=False,
    set='Base'
  ),
  'DOMESTIC_AIRPORT': HexTile(
    id='DOMESTIC_AIRPORT',
    key='domestic_airport',
    name='Domestic Airport',
    image='assets/tiles/B/domestic_airport.webp',
    category=TileCategory.INDUSTRIAL,
    type=TileType.AIRPORT,
    cost=11,
    incomeChange=1,
    populationChange=0,
    reputationChange=0, 
    effects=[
      TileEffect(trigger=EffectTrigger.ALL, target='Airport', reputation=1),
      TileEffect(trigger=EffectTrigger.ADJACENT, target='Residential', reputation=-1)
    ],
    description='+1 income. +1 Reputation for every Airport. -1 Reputation for each adjacent Residential.',
    limit=3,
    isUnique=False,
    set='Base'
  ),
  'ELEMENTARY_SCHOOL': HexTile(
    id='ELEMENTARY_SCHOOL',
    key='elementary_school',
    name='Elementary School',
    image='assets/tiles/B/elementary_school.webp',
    category=TileCategory.CIVIC,
    type=TileType.SCHOOL,
    cost=5,
    incomeChange=0,
    populationChange=0,
    reputationChange=1, 
    effects=[
      TileEffect(trigger=EffectTrigger.ALL_OWN, target='Residential', population=1)
    ],
    description='+1 Reputation. +1 Population for each of your Residential.',
    limit=3,
    isUnique=False,
    set='Base'
  ),
  'GAS_STATION': HexTile(
    id='GAS_STATION',
    key='gas_station',
    name='Gas Station',
    image='assets/tiles/B/gas_station.webp',
    category=TileCategory.COMMERCIAL,
    type=None,
    cost=7,
    incomeChange=1,
    populationChange=0,
    reputationChange=0, 
    effects=[
      TileEffect(trigger=EffectTrigger.ADJACENT, target='Residential', population=1)
    ],
    description='+1 Income. +1 Population for each adjacent Residential.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'HOSTEL': HexTile(
    id='HOSTEL',
    key='hostel',
    name='Hostel',
    image='assets/tiles/B/hostel.webp',
    category=TileCategory.RESIDENTIAL,
    type=None,
    cost=0,
    incomeChange=0,
    populationChange=2,
    reputationChange=0, 
    effects=[
      TileEffect(trigger=EffectTrigger.ADJACENT, target='Commercial', reputation=-1)
    ], 
    description='+2 population. -1 reputation for each adjacent Commercial.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'HOUSING_PROJECTS': HexTile(
    id='HOUSING_PROJECTS',
    key='housing_projects',
    name='Housing Projects',
    image='assets/tiles/B/housing_projects.webp',
    category=TileCategory.RESIDENTIAL,
    type=None,
    cost=8,
    incomeChange=0,
    populationChange=10,
    reputationChange=0, 
    effects=[
      TileEffect(
        trigger=EffectTrigger.ADJACENT, 
        target=[TileCategory.RESIDENTIAL, TileCategory.COMMERCIAL, TileCategory.CIVIC], 
        reputation=-2
      ),
    ],
    description='+10 population. -2 reputation for each adjacent Residential, Civic or Commercial.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'MOVIE_THEATER': HexTile(
    id='MOVIE_THEATER',
    key='movie_theater',
    name='Movie Theater',
    image='assets/tiles/B/movie_theater.webp',
    category=TileCategory.COMMERCIAL,
    type=None,
    cost=10,
    incomeChange=1,
    populationChange=0,
    reputationChange=0, 
    effects=[
      TileEffect(trigger=EffectTrigger.ADJACENT, target='Residential', income=1)
    ],
    description='+1 income. +1 income for each adjacent Residential.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'MUSEUM': HexTile(
    id='MUSEUM',
    key='museum',
    name='Museum',
    image='assets/tiles/B/museum.webp',
    category=TileCategory.CIVIC,
    type=None,
    cost=8,
    incomeChange=0,
    populationChange=0,
    reputationChange=1, 
    effects=[
      TileEffect(trigger=EffectTrigger.ADJACENT, target='Civic', reputation=1)
    ],
    description='+1 reputation. +1 reputation for each adjacent Civic.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'OFFICE_OF_BUREAUCRACY': HexTile(
    id='OFFICE_OF_BUREAUCRACY',
    key='office_of_bureaucracy',
    name='Office of Bureaucracy',
    image='assets/tiles/B/office_of_bureaucracy.webp',
    category=TileCategory.CIVIC,
    type=TileType.OFFICE,
    cost=9,
    incomeChange=0,
    populationChange=0,
    reputationChange=-2, 
    effects=[
      TileEffect(trigger=EffectTrigger.ALL_OWN, target='Civic', income=1)
    ],
    description='-2 reputation. +1 income for each of your Civic.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'POSTAL_SERVICE': HexTile(
    id='POSTAL_SERVICE',
    key='postal_service',
    name='Postal Service',
    image='assets/tiles/B/postal_service.webp',
    category=TileCategory.CIVIC,
    type=None,
    cost=12,
    incomeChange=0,
    populationChange=0,
    reputationChange=0, 
    effects=[ 
      TileEffect(trigger=EffectTrigger.ALL_OWN, target='Commercial', income=1)
    ],
    description='+1 income for each of your Commercial.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'POWER_STATION': HexTile(
    id='POWER_STATION',
    key='power_station',
    name='Power Station',
    image='assets/tiles/B/power_station.webp',
    category=TileCategory.CIVIC,
    type=None,
    cost=11,
    incomeChange=0,
    populationChange=0,
    reputationChange=0, 
    effects=[ 
      TileEffect(trigger=EffectTrigger.ALL_OWN, target='Industrial', income=1)
    ],
    description='+1 income for each of your Industrial.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'RETIREMENT_VILLAGE': HexTile(
    id='RETIREMENT_VILLAGE',
    key='retirement_village',
    name='Retirement Village',
    image='assets/tiles/B/retirement_village.webp',
    category=TileCategory.RESIDENTIAL,
    type=None,
    cost=8,
    incomeChange=0,
    populationChange=5,
    reputationChange=0, 
    effects=[],
    description='+5 population.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'SHIPPING_CENTER': HexTile(
    id='SHIPPING_CENTER',
    key='shipping_center',
    name='Shipping Center',
    image='assets/tiles/B/shipping_center.webp',
    category=TileCategory.COMMERCIAL,
    type=None,
    cost=16,
    incomeChange=1,
    populationChange=0,
    reputationChange=0, 
    effects=[
      TileEffect(trigger=EffectTrigger.ALL, target='Commercial', money=2)
    ],
    description='+1 income. +$2 for every Commercial.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'SKYSCRAPER': HexTile(
    id='SKYSCRAPER',
    key='skyscraper',
    name='Skyscraper',
    image='assets/tiles/B/skyscraper.webp',
    category=TileCategory.COMMERCIAL,
    type=TileType.SKYSCRAPER,
    cost=11,
    incomeChange=3,
    populationChange=0,
    reputationChange=0, 
    effects=[
      TileEffect(trigger=EffectTrigger.AFTER, target='Skyscraper', income=-1)
    ],
    description='+3 income. -1 income for all Skyscrapers built after this one.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'STADIUM': HexTile(
    id='STADIUM',
    key='stadium',
    name='Stadium',
    image='assets/tiles/B/stadium.webp',
    category=TileCategory.CIVIC,
    type=None,
    cost=16,
    incomeChange=1,
    populationChange=0,
    reputationChange=0, 
    effects=[
      TileEffect(trigger=EffectTrigger.ADJACENT, target='Residential', reputation=2)
    ],
    description='+1 income. +2 reputation for each adjacent Residential.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'WAREHOUSE': HexTile(
    id='WAREHOUSE',
    key='warehouse',
    name='Warehouse',
    image='assets/tiles/B/warehouse.webp',
    category=TileCategory.INDUSTRIAL,
    type=None,
    cost=13,
    incomeChange=0,
    populationChange=0,
    reputationChange=-1, 
    effects=[
      TileEffect(trigger=EffectTrigger.ADJACENT, target='Commercial', income=2)
    ],
    description='-1 reputation. +2 income for each adjacent Commercial.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
}