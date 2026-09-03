# backend/app/data/goals.py
from ..models import Goal, GoalCondition, GoalConditionType, GoalTarget

GOALS = {
  'AQUATIC_ENGINEER': Goal(
    id='AQUATIC_ENGINEER', key='aquatic_engineer', name='Aquatic Engineer', image='assets/goals/aquatic_engineer.webp',
    description='Most Lakes',
    condition=GoalCondition(type=GoalConditionType.MOST, target=GoalTarget.LAKE),
    populationBonus=20, set='Base'
  ),
  'AIR_TRAFFIC_CONTROLLER': Goal(
    id='AIR_TRAFFIC_CONTROLLER', key='air_traffic_controller', name='Air Traffic Controller', image='assets/goals/air_traffic_controller.webp',
    description='Most Airports',
    condition=GoalCondition(type=GoalConditionType.MOST, target=GoalTarget.AIRPORT),
    populationBonus=10, set='Base'
  ),
  'AQUAPHOBIAN': Goal(
    id='AQUAPHOBIAN', key='aquaphobian', name='Aquaphobian', image='assets/goals/aquaphobian.webp',
    description='Fewest Lakes',
    condition=GoalCondition(type=GoalConditionType.FEWEST, target=GoalTarget.LAKE),
    populationBonus=20, set='Base'
  ),
  'BILLIONAIRE': Goal(
    id='BILLIONAIRE', key='billionaire', name='Billionaire', image='assets/goals/billionaire.webp',
    description='Most Money',
    condition=GoalCondition(type=GoalConditionType.MOST, target=GoalTarget.MONEY),
    populationBonus=10, set='Base'
  ),
  'BUILDER': Goal(
    id='BUILDER', key='builder', name='Builder', image='assets/goals/builder.webp',
    description='Most Residential',
    condition=GoalCondition(type=GoalConditionType.MOST, target=GoalTarget.RESIDENTIAL),
    populationBonus=15, set='Base'
  ),
  'CAPITALIST': Goal(
    id='CAPITALIST', key='capitalist', name='Capitalist', image='assets/goals/capitalist.webp',
    description='Fewest Residential',
    condition=GoalCondition(type=GoalConditionType.FEWEST, target=GoalTarget.RESIDENTIAL),
    populationBonus=20, set='Base'
  ),
  'CIVIL_ENGINEER': Goal(
    id='CIVIL_ENGINEER', key='civil_engineer', name='Civil Engineer', image='assets/goals/civil_engineer.webp',
    description='Most Civic',
    condition=GoalCondition(type=GoalConditionType.MOST, target=GoalTarget.CIVIC),
    populationBonus=15, set='Base'
  ),
  'DEVELOPER': Goal(
    id='DEVELOPER', key='developer', name='Developer', image='assets/goals/developer.webp',
    description='Most Commercial',
    condition=GoalCondition(type=GoalConditionType.MOST, target=GoalTarget.COMMERCIAL),
    populationBonus=10, set='Base'
  ),
  'EMPLOYER': Goal(
    id='EMPLOYER', key='employer', name='Employer', image='assets/goals/employer.webp',
    description='Fewest Played Investment Markers',
    condition=GoalCondition(type=GoalConditionType.MOST, target=GoalTarget.INVESTMENT_MARKERS),
    populationBonus=15, set='Base'
  ),
  'ENVIRONMENTALIST': Goal(
    id='ENVIRONMENTALIST', key='environmentalist', name='Environmentalist', image='assets/goals/environmentalist.webp',
    description='Fewest Industrial',
    condition=GoalCondition(type=GoalConditionType.FEWEST, target=GoalTarget.INDUSTRIAL),
    populationBonus=15, set='Base'
  ),
  'HARBORMASTER': Goal(
    id='HARBORMASTER', key='harbormaster', name='Harbormaster', image='assets/goals/harbormaster.webp',
    description='Most Contiguous Lake',
    condition=GoalCondition(type=GoalConditionType.MOST, target=GoalTarget.CONTIGUOUS_LAKES),
    populationBonus=10, set='Base'
  ),
  'INDUSTRIALIST': Goal(
    id='INDUSTRIALIST', key='industrialist', name='Industrialist', image='assets/goals/industrialist.webp',
    description='Most Industrial',
    condition=GoalCondition(type=GoalConditionType.MOST, target=GoalTarget.INDUSTRIAL),
    populationBonus=15, set='Base'
  ),  
  'INVESTOR': Goal(
    id='INVESTOR', key='investor', name='Investor', image='assets/goals/investor.webp',
    description='Highest Income',
    condition=GoalCondition(type=GoalConditionType.MOST, target=GoalTarget.INCOME),
    populationBonus=15, set='Base'
  ),
  'LIBERTARIAN': Goal(
    id='LIBERTARIAN', key='libertarian', name='Libertarian', image='assets/goals/libertarian.webp',
    description='Fewest Civic',
    condition=GoalCondition(type=GoalConditionType.FEWEST, target=GoalTarget.CIVIC),
    populationBonus=15, set='Base'
  ),
  'LUMINARY': Goal(
    id='LUMINARY', key='luminary', name='Luminary', image='assets/goals/luminary.webp',
    description='Highest Reputation',
    condition=GoalCondition(type=GoalConditionType.MOST, target=GoalTarget.REPUTATION),
    populationBonus=10, set='Base'
  ),  
  'MISCREANT': Goal(
    id='MISCREANT', key='miscreant', name='Miscreant', image='assets/goals/miscreant.webp',
    description='Lowest reputation',
    condition=GoalCondition(type=GoalConditionType.FEWEST, target=GoalTarget.REPUTATION),
    populationBonus=20, set='Base'
  ),
  'MISER': Goal(
    id='MISER', key='miser', name='Miser', image='assets/goals/miser.webp',
    description='Lowest Income',
    condition=GoalCondition(type=GoalConditionType.FEWEST, target=GoalTarget.INCOME),
    populationBonus=15, set='Base'
  ),  
  'PUBLIC_OFFICIAL': Goal(
    id='PUBLIC_OFFICIAL', key='public_official', name='Public Official', image='assets/goals/public_official.webp',
    description='Most Contiguous Civic',
    condition=GoalCondition(type=GoalConditionType.MOST, target=GoalTarget.CONTIGUOUS_CIVIC),
    populationBonus=15, set='Base'
  ),  
  'SOCIALIST': Goal(
    id='SOCIALIST', key='socialist', name='Socialist', image='assets/goals/socialist.webp',
    description='Fewest Commercial',
    condition=GoalCondition(type=GoalConditionType.FEWEST, target=GoalTarget.COMMERCIAL),
    populationBonus=10, set='Base'
  ),
  'SPENDTHRIFT': Goal(
    id='SPENDTHRIFT', key='spendthrift', name='Spendthrift', image='assets/goals/spendthrift.webp',
    description='Least Money',
    condition=GoalCondition(type=GoalConditionType.FEWEST, target=GoalTarget.MONEY),
    populationBonus=10, set='Base'
  ),
}
