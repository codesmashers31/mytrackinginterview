export const TOPIC_GUIDES = {
  'Percentage': {
    topicName: 'Percentage',
    category: 'Commercial Math',
    coreIntuition: 'Percentage simply means "per hundred" (out of 100). Any fraction x/y can be converted to percentage by multiplying by 100. It is the single most important foundation for Profit & Loss, Simple/Compound Interest, and Data Interpretation.',
    formulas: [
      { name: 'Percentage Value', formula: 'P% of X = (P / 100) * X', note: 'Basic calculation' },
      { name: 'Percentage Change / Increase / Decrease', formula: 'Change % = [(Final Value - Initial Value) / Initial Value] * 100', note: 'Always divide by initial/base value' },
      { name: 'Successive Percentage Change', formula: 'Net % Change = [a + b + (ab / 100)] %', note: 'Use + for increase, - for decrease' },
      { name: 'Price & Consumption Rule', formula: 'If price increases by R%, consumption must decrease by [R / (100 + R)] * 100 to keep expenditure constant.', note: 'Inversely proportional relation' }
    ],
    shortcuts: [
      { title: 'Fraction Split Shortcut', tip: 'Convert percentages into known fraction chunks: 37.5% = 25% + 12.5% = 1/4 + 1/8 = 3/8. 66.66% = 2/3.' },
      { title: 'A% of B is always equal to B% of A', tip: 'Calculating 64% of 25 is difficult, but 25% of 64 is just 64 / 4 = 16.' },
      { title: 'Successive Discounts Shortcut', tip: 'Two successive discounts of 20% and 10% -> -20 - 10 + ((-20 * -10)/100) = -30 + 2 = 28% net discount.' }
    ],
    workedExamples: [
      {
        difficulty: 'Easy',
        question: 'If the price of petrol increases by 25%, by what percentage should a driver reduce consumption so that the total expenditure remains unchanged?',
        rootLogic: 'Expenditure = Price * Consumption. If Price increases by R%, Consumption must decrease by [R / (100 + R)] * 100%.',
        givenData: 'Price Increase R = 25%',
        stepByStep: 'Step 1: Formula = [25 / (100 + 25)] * 100%\nStep 2: [25 / 125] * 100% = (1 / 5) * 100%\nStep 3: = 20% reduction.',
        shortcutTrick: 'Using fraction table: Price increased by 1/4 (25%). When numerator is 1 and price goes up by 1/x, consumption goes down by 1/(x+1). Here 1/(4+1) = 1/5 = 20% in 2 seconds!',
        answer: '20% reduction'
      },
      {
        difficulty: 'Medium',
        question: 'A student scored 30% marks and failed by 15 marks. Another student scored 40% marks and got 35 marks more than the minimum passing marks. What are the total maximum marks?',
        rootLogic: 'Equate the pass marks from both student scenarios: (30% of Total + 15) = (40% of Total - 35).',
        givenData: 'Student A = 30% + 15; Student B = 40% - 35',
        stepByStep: 'Step 1: 40% - 30% = 15 + 35\nStep 2: 10% of Total = 50 marks\nStep 3: Total marks (100%) = 50 * 10 = 500 marks.',
        shortcutTrick: 'Difference in percentage (40% - 30% = 10%) equals sum of deviation (15 fail + 35 excess = 50). Since 10% = 50 -> 100% = 500 directly.',
        answer: '500 marks'
      }
    ]
  },
  'Profit and Loss': {
    topicName: 'Profit and Loss',
    category: 'Commercial Math',
    coreIntuition: 'Cost Price (CP) is the baseline investment. Selling Price (SP) is the realized revenue. Marked Price (MP) is the list price before discount. Profit or Loss is always calculated with respect to CP unless explicitly stated.',
    formulas: [
      { name: 'Profit & Loss', formula: 'Profit = SP - CP (if SP > CP), Loss = CP - SP (if CP > SP)', note: 'Basic profit equation' },
      { name: 'Profit % & Loss %', formula: 'Profit % = (Profit / CP) * 100, Loss % = (Loss / CP) * 100', note: 'Base is always CP' },
      { name: 'Selling Price from Profit/Loss', formula: 'SP = CP * (100 + Profit%) / 100 OR SP = CP * (100 - Loss%) / 100', note: 'Multiplier method' },
      { name: 'Discount %', formula: 'Discount % = [(MP - SP) / MP] * 100', note: 'Base for discount is Marked Price (MP)' }
    ],
    shortcuts: [
      { title: 'Articles CP = Articles SP Rule', tip: 'If CP of X articles = SP of Y articles, Profit % = [(X - Y) / Y] * 100.' },
      { title: 'Dishonest Dealer Faulty Weight Shortcut', tip: 'Profit % = [Error / (True Value - Error)] * 100. If 900g is used instead of 1000g: Error = 100g. Profit = [100 / 900] * 100 = 11.11%.' }
    ],
    workedExamples: [
      {
        difficulty: 'Easy',
        question: 'If the cost price of 15 pens is equal to the selling price of 12 pens, find the profit or loss percentage.',
        rootLogic: 'CP of 15 = SP of 12. Let CP of 1 pen = Re 1. CP of 15 = Rs 15. SP of 12 = Rs 15 -> SP of 1 = 15/12 = Rs 1.25. Profit = 0.25 on 1.',
        givenData: 'X = 15, Y = 12',
        stepByStep: 'Step 1: Profit % = [(15 - 12) / 12] * 100\nStep 2: (3 / 12) * 100 = (1 / 4) * 100 = 25% Profit.',
        shortcutTrick: 'Formula: (Goods Kept / Goods Sold) * 100 = (3 / 12) * 100 = 25% instant profit!',
        answer: '25% Profit'
      }
    ]
  },
  'Time and Work': {
    topicName: 'Time and Work',
    category: 'Arithmetic',
    coreIntuition: 'Total Work is best assumed as the LCM of the individual times. Efficiency is the rate of work done per day (Total Work / Days). If A is twice as efficient as B, A takes half the time.',
    formulas: [
      { name: 'Total Work (LCM Method)', formula: 'Total Work = LCM(Days of A, Days of B, Days of C)', note: 'Assign total units' },
      { name: 'Efficiency (Units/day)', formula: 'Efficiency = Total Work Units / Total Days', note: 'Work speed' },
      { name: 'Combined Time', formula: 'Combined Days = Total Work / Sum of Efficiencies', note: 'Working together' },
      { name: 'Chain Rule (MDH Rule)', formula: '(M1 * D1 * H1) / W1 = (M2 * D2 * H2) / W2', note: 'Men, Days, Hours, Work units' }
    ],
    shortcuts: [
      { title: 'Two Person Direct Formula', tip: 'A takes X days, B takes Y days. Together they take (X * Y) / (X + Y) days.' },
      { title: 'Negative Work (Pipes & Cisterns)', tip: 'Inlet pipe adds positive efficiency (+E), outlet/leak pipe subtracts efficiency (-E).' }
    ],
    workedExamples: [
      {
        difficulty: 'Easy',
        question: 'A can do a piece of work in 10 days and B can do it in 15 days. How many days will they take working together?',
        rootLogic: 'Assume Total Work = LCM(10, 15) = 30 units.',
        givenData: 'A = 10 days, B = 15 days',
        stepByStep: 'Step 1: Total Work = LCM(10, 15) = 30 units\nStep 2: A efficiency = 30/10 = 3 units/day; B efficiency = 30/15 = 2 units/day\nStep 3: Combined efficiency = 3 + 2 = 5 units/day\nStep 4: Days = 30 / 5 = 6 days.',
        shortcutTrick: '(10 * 15) / (10 + 15) = 150 / 25 = 6 days in 3 seconds!',
        answer: '6 days'
      }
    ]
  },
  'Time, Speed and Distance': {
    topicName: 'Time, Speed and Distance',
    category: 'Arithmetic',
    coreIntuition: 'Distance = Speed * Time. Key conversions: km/h to m/s (multiply by 5/18); m/s to km/h (multiply by 18/5). Relative speed adds when moving in opposite directions, subtracts when in the same direction.',
    formulas: [
      { name: 'Basic Relation', formula: 'Distance = Speed * Time, Speed = Distance / Time', note: 'Core equation' },
      { name: 'Unit Conversion', formula: '1 km/h = 5/18 m/s, 1 m/s = 18/5 km/h', note: 'Conversion factor' },
      { name: 'Average Speed (Equal Distances)', formula: 'Avg Speed = (2 * S1 * S2) / (S1 + S2)', note: 'Harmonic mean of speeds' },
      { name: 'Relative Speed', formula: 'Opposite direction = S1 + S2; Same direction = |S1 - S2|', note: 'Trains & overtaking' }
    ],
    shortcuts: [
      { title: 'Train Crossing Platform', tip: 'Total Distance = Length of Train + Length of Platform.' },
      { title: 'Boats & Streams Shortcut', tip: 'Downstream Speed (D) = Boat Speed (u) + Stream (v). Upstream (U) = u - v. Boat Speed u = (D + U)/2, Stream v = (D - U)/2.' }
    ],
    workedExamples: [
      {
        difficulty: 'Easy',
        question: 'A train 180 meters long is traveling at 54 km/h. How many seconds will it take to pass a telegraph post?',
        rootLogic: 'When passing a point object (post/man), Distance = Length of train (180m). Convert speed from km/h to m/s.',
        givenData: 'Distance = 180m, Speed = 54 km/h',
        stepByStep: 'Step 1: Speed in m/s = 54 * (5/18) = 15 m/s\nStep 2: Time = Distance / Speed = 180 / 15 = 12 seconds.',
        shortcutTrick: '54 is 3 times 18 -> speed is 3 * 5 = 15 m/s. 180 / 15 = 12s.',
        answer: '12 seconds'
      }
    ]
  }
};
