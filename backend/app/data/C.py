from ..models import HexTile, TileCategory, TileType, TileEffect, EffectTrigger

TilesC = {
  'APARTMENTS': HexTile(
    id='APARTMENTS',
    key='apartments',
    name='Apartments',
    image='assets/tiles/C/apartments.webp',
    category=TileCategory.RESIDENTIAL,
    type=None,
    cost=12,
    incomeChange=0,
    populationChange=5,
    reputationChange=0, 
    effects=[
      TileEffect(trigger=EffectTrigger.ADJACENT, target='Commercial', population=2)
    ],
    description='+5 population. +2 population for each adjacent Commercial.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'BED_AND_BREAKFAST': HexTile(
    id='BED_AND_BREAKFAST',
    key='bed_and_breakfast',
    name='Bed & Breakfast',
    image='assets/tiles/C/bed_and_breakfast.webp',
    category=TileCategory.RESIDENTIAL,
    type=None,
    cost=9,
    incomeChange=0,
    populationChange=2,
    reputationChange=0, 
    effects=[
      TileEffect(trigger=EffectTrigger.ALL_OWN, target='Residential', population=1)
    ],
    description='+2 population. +1 population for each of your Residential.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'BOUTIQUE': HexTile(
    id='BOUTIQUE',
    key='boutique',
    name='Boutique',
    image='assets/tiles/C/boutique.webp',
    category=TileCategory.COMMERCIAL,
    type=None,
    cost=9,
    incomeChange=1,
    populationChange=0,
    reputationChange=0, 
    effects=[
      TileEffect(trigger=EffectTrigger.ADJACENT, target='Residential', reputation=1)
    ],
    description='+1 income. +1 reputation for each adjacent Residential.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'CHIP_FABRICATION_PLANT': HexTile(
    id='CHIP_FABRICATION_PLANT',
    key='chip_fabrication_plant',
    name='Chip Fabrication Plant',
    image='assets/tiles/C/chip_fabrication_plant.webp',
    category=TileCategory.INDUSTRIAL,
    type=None,
    cost=18,
    incomeChange=0,
    populationChange=0,
    reputationChange=2, 
    effects=[ 
      TileEffect(trigger=EffectTrigger.ALL_OWN, target='Commercial', income=1)
    ],
    description='+2 reputation. +1 income for each of your Commercial.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'CONDOMINIUM': HexTile(
    id='CONDOMINIUM',
    key='condominium',
    name='Condominium',
    image='assets/tiles/C/condominium.webp',
    category=TileCategory.RESIDENTIAL,
    type=None,
    cost=14,
    incomeChange=0,
    populationChange=5,
    reputationChange=0, 
    effects=[
      TileEffect(trigger=EffectTrigger.ADJACENT, target='Commercial', population=3)      
    ],
    description='+5 population. +3 population for each adjacent Commercial.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'HIGH_SCHOOL': HexTile(
    id='HIGH_SCHOOL',
    key='high_school',
    name='High School',
    image='assets/tiles/C/high_school.webp',
    category=TileCategory.CIVIC,
    type=TileType.SCHOOL,
    cost=18,
    incomeChange=0,
    populationChange=0,
    reputationChange=1, 
    effects=[
      TileEffect(trigger=EffectTrigger.ALL_OWN, target='Residential', population=3)      
    ],
    description='+1 reputation. +3 population for each of your Residential tiles',
    limit=3,
    isUnique=False,
    set='Base'
  ),
  'HOTEL': HexTile(
    id='HOTEL',
    key='hotel',
    name='Hotel',
    image='assets/tiles/C/hotel.webp',
    category=TileCategory.COMMERCIAL,
    type=None,
    cost=13,
    incomeChange=1,
    populationChange=0,
    reputationChange=0, 
    effects=[
      TileEffect(trigger=EffectTrigger.ALL_OTHER, target=TileCategory.RESIDENTIAL, population=1)
    ],
    description='+1 income. +1 population for all other boroughs Residential.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'INTERNATIONAL_AIRPORT': HexTile(
    id='INTERNATIONAL_AIRPORT',
    key='international_airport',
    name='International Airport',
    image='assets/tiles/C/international_airport.webp',
    category=TileCategory.INDUSTRIAL,
    type=TileType.AIRPORT,
    cost=18,
    incomeChange=0,
    populationChange=0,
    reputationChange=0, 
    effects=[
      TileEffect(trigger=EffectTrigger.ALL, target='Airport', income=1),
      TileEffect(trigger=EffectTrigger.ALL, target='Airport', reputation=1),
      TileEffect(trigger=EffectTrigger.ADJACENT, target='Residential', reputation=-1)      
    ],
    description='+1 income and +1 reputation for every airport. -1 reputation for each adjacent Residential.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'LOCAL_EPA_OFFICE': HexTile(
    id='LOCAL_EPA_OFFICE',
    key='local_epa_office',
    name='Local EPA Office',
    image='assets/tiles/C/local_epa_office.webp',
    category=TileCategory.CIVIC,
    type=TileType.OFFICE,
    cost=12,
    incomeChange=0,
    populationChange=0,
    reputationChange=1, 
    effects=[
      TileEffect(trigger=EffectTrigger.ALL, target='Industrial', money=2)
    ],
    description= '+1 reputation. +$2 for every Industrial.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'MIDDLE_SCHOOL': HexTile(
    id='MIDDLE_SCHOOL',
    key='middle_school',
    name='Middle School',
    image='assets/tiles/C/middle_school.webp',
    category=TileCategory.CIVIC,
    type=TileType.SCHOOL,
    cost=10,
    incomeChange=0,
    populationChange=0,
    reputationChange=1, 
    effects=[
      TileEffect(trigger=EffectTrigger.ALL_OWN, target='Residential', population=2)
    ],
    description='+1 reputation. +2 population for each of your Residential.',
    limit=3,
    isUnique=False,
    set='Base'
  ),
  'NEW_CAR_DEALERSHIP': HexTile(
    id='NEW_CAR_DEALERSHIP',
    key='new_car_dealership',
    name='New Car Dealership',
    image='assets/tiles/C/new_car_dealership.webp',
    category=TileCategory.COMMERCIAL,
    type=TileType.DEALERSHIP,
    cost=12,
    incomeChange=5,
    populationChange=0,
    reputationChange=0, 
    effects=[
      TileEffect(trigger=EffectTrigger.AFTER, target='Dealership', income=-2)
    ],
    description='+5 income. -2 income for all Car Dealerships built after this one.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'ONE_MORE_ROUND': HexTile(
    id='ONE_MORE_ROUND',
    key='one_more_round',
    name='One More Round',
    image='assets/tiles/C/one_more_round.webp',
    category=TileCategory.COMMERCIAL,
    type=None,
    cost=0,
    incomeChange=0,
    populationChange=0,
    reputationChange=0, 
    effects=[],
    description='Initiates the last round of the game.',
    limit=1,
    isUnique=True,
    set='Base'
  ),
  'PR_FIRM': HexTile(
    id='PR_FIRM',
    key='pr_firm',
    name='PR Firm',
    image='assets/tiles/C/pr_firm.webp',
    category=TileCategory.COMMERCIAL,
    type=None,
    cost=20,
    incomeChange=-2,
    populationChange=0,
    reputationChange=0, 
    effects=[
      TileEffect(trigger=EffectTrigger.INVESTMENT_LINE, reputation=1)
    ],
    description='-2 income. +1 reputation after you pass each Red Line.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'RECYCLING_PLANT': HexTile(
    id='RECYCLING_PLANT',
    key='recycling_plant',
    name='Recycling Plant',
    image='assets/tiles/C/recycling_plant.webp',
    category=TileCategory.INDUSTRIAL,
    type=None,
    cost=17,
    incomeChange=0,
    populationChange=0,
    reputationChange=1, 
    effects=[ 
      TileEffect(trigger=EffectTrigger.ADJACENT, target='Industrial', reputation=2)
    ],
    description='+1 reputation. +2 reputation for each adjacent Industrial.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'RESORT': HexTile(
    id='RESORT',
    key='resort',
    name='Resort',
    image='assets/tiles/C/resort.webp',
    category=TileCategory.COMMERCIAL,
    type=None,
    cost=16,
    incomeChange=1,
    populationChange=0,
    reputationChange=0, 
    effects=[
      TileEffect(trigger=EffectTrigger.ALL, target='Residential', population=1)
    ],
    description='+1 income. +1 population for every Residential.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'UNIVERSITY': HexTile(
    id='UNIVERSITY',
    key='university',
    name='University',
    image='assets/tiles/C/university.webp',
    category=TileCategory.CIVIC,
    type=None,
    cost=15,
    incomeChange=2,
    populationChange=0,
    reputationChange=0, 
    effects=[
      TileEffect(trigger=EffectTrigger.ALL, target='School', reputation=1)
    ],
    description='+2 income. +1 reputation for every School.',
    limit=2,
    isUnique=False,
    set='Base'
  )
}