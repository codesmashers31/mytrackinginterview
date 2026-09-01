export const FRACTION_TO_PERCENTAGE_TABLE = [
  { fraction: '1/1', percentage: '100%', decimal: '1.000' },
  { fraction: '1/2', percentage: '50%', decimal: '0.500' },
  { fraction: '1/3', percentage: '33.33% (33 1/3%)', decimal: '0.333' },
  { fraction: '1/4', percentage: '25%', decimal: '0.250' },
  { fraction: '1/5', percentage: '20%', decimal: '0.200' },
  { fraction: '1/6', percentage: '16.66% (16 2/3%)', decimal: '0.166' },
  { fraction: '1/7', percentage: '14.28% (14 2/7%)', decimal: '0.142' },
  { fraction: '1/8', percentage: '12.5% (12 1/2%)', decimal: '0.125' },
  { fraction: '1/9', percentage: '11.11% (11 1/9%)', decimal: '0.111' },
  { fraction: '1/10', percentage: '10%', decimal: '0.100' },
  { fraction: '1/11', percentage: '9.09% (9 1/11%)', decimal: '0.090' },
  { fraction: '1/12', percentage: '8.33% (8 1/3%)', decimal: '0.083' },
  { fraction: '1/13', percentage: '7.69%', decimal: '0.076' },
  { fraction: '1/14', percentage: '7.14% (7 1/7%)', decimal: '0.071' },
  { fraction: '1/15', percentage: '6.66% (6 2/3%)', decimal: '0.066' },
  { fraction: '1/16', percentage: '6.25% (6 1/4%)', decimal: '0.062' },
  { fraction: '1/20', percentage: '5%', decimal: '0.050' },
  { fraction: '1/25', percentage: '4%', decimal: '0.040' }
];

export const SQUARES_TABLE = Array.from({ length: 50 }, (_, i) => ({
  number: i + 1,
  square: (i + 1) * (i + 1)
}));

export const CUBES_TABLE = Array.from({ length: 30 }, (_, i) => ({
  number: i + 1,
  cube: (i + 1) * (i + 1) * (i + 1)
}));

export const DIVISIBILITY_RULES = [
  { number: 2, rule: 'Last digit is even (0, 2, 4, 6, 8)', example: '348 ends in 8 -> Divisible by 2' },
  { number: 3, rule: 'Sum of all digits is divisible by 3', example: '528 -> 5+2+8 = 15 (15 is divisible by 3) -> Divisible' },
  { number: 4, rule: 'Last 2 digits form a number divisible by 4', example: '1,324 -> 24 is divisible by 4 -> Divisible' },
  { number: 5, rule: 'Last digit is 0 or 5', example: '875 ends in 5 -> Divisible' },
  { number: 6, rule: 'Divisible by both 2 and 3', example: '732 -> Even and sum (7+3+2=12) is div by 3 -> Divisible' },
  { number: 7, rule: 'Double the last digit and subtract from remaining number. If result is 0 or div by 7 -> Divisible', example: '343 -> 34 - (3*2) = 28 (28 is div by 7) -> Divisible' },
  { number: 8, rule: 'Last 3 digits form a number divisible by 8', example: '5,128 -> 128 is div by 8 (128/8 = 16) -> Divisible' },
  { number: 9, rule: 'Sum of all digits is divisible by 9', example: '4,572 -> 4+5+7+2 = 18 (18 is div by 9) -> Divisible' },
  { number: 10, rule: 'Last digit is 0', example: '950 -> Divisible' },
  { number: 11, rule: 'Difference between sum of digits at odd places and even places is 0 or multiple of 11', example: '1,331 -> (1+3) - (3+1) = 0 -> Divisible' },
  { number: 12, rule: 'Divisible by both 3 and 4', example: '432 -> Sum=9 (div by 3) and last 2 digits=32 (div by 4) -> Divisible' },
  { number: 13, rule: 'Add 4 times the last digit to the remaining number. If result is div by 13 -> Divisible', example: '273 -> 27 + (3*4) = 39 (39 is div by 13) -> Divisible' },
  { number: 17, rule: 'Subtract 5 times the last digit from remaining number. If result is div by 17 -> Divisible', example: '221 -> 22 - (1*5) = 17 (17 is div by 17) -> Divisible' },
  { number: 19, rule: 'Add 2 times the last digit to the remaining number. If result is div by 19 -> Divisible', example: '361 -> 36 + (1*2) = 38 (38 is div by 19) -> Divisible' }
];

export const SPEED_MATH_SHORTCUTS = [
  {
    title: 'Squaring Any Number Ending with 5 in 2 Seconds',
    technique: 'Multiply the first digit(s) by its successor (n * (n+1)), then append 25 at the end.',
    example: '65² -> First part = 6 * 7 = 42. Last part = 25. Answer = 4225. 95² -> 9 * 10 = 90 -> 9025.'
  },
  {
    title: 'Squaring Numbers Near Base 50 (41 to 59)',
    technique: 'Difference from 50 (d). First 2 digits = 25 + d (or 25 - d). Last 2 digits = d².',
    example: '54² -> Difference d = +4. First part = 25 + 4 = 29. Last part = 4² = 16. Answer = 2916. 47² -> d = -3 -> 25 - 3 = 22, 3² = 09 -> 2209.'
  },
  {
    title: 'Squaring Numbers Near Base 100 (91 to 109)',
    technique: 'Difference from 100 (d). First part = Number + d (or Number - d). Last part = d².',
    example: '106² -> d = +6 -> 106 + 6 = 112, 6² = 36 -> 11236. 94² -> d = -6 -> 94 - 6 = 88, 6² = 36 -> 8836.'
  },
  {
    title: 'Multiplying Any 2-Digit Numbers (Criss-Cross Vedic Method)',
    technique: 'For AB * CD: Step 1: B*D (right). Step 2: (A*D + B*C) (cross). Step 3: A*C (left). Carry forward digits.',
    example: '23 * 41 -> 3*1 = 3; (2*1 + 3*4) = 14 (write 4, carry 1); 2*4 + 1 = 9 -> Answer = 943.'
  },
  {
    title: 'LCM Speed Calculation (Highest Common Multiple Method)',
    technique: 'Take the largest number. Check if others divide it. If not, check its 2x, 3x, 4x multiples until all divide evenly.',
    example: 'LCM of (12, 18, 24) -> Largest is 24. 24 not div by 18. Try 24 * 2 = 48 (not div by 18). Try 24 * 3 = 72 (divisible by 12, 18, 24) -> LCM = 72.'
  },
  {
    title: 'Units Digit of Large Powers Rule (Cyclicity of Powers)',
    technique: 'Power cycle of digits: 0, 1, 5, 6 always end with same digit. 4 & 9 have cycle of 2. 2, 3, 7, 8 have cycle of 4 (divide power by 4, take remainder).',
    example: 'Units digit of 7¹⁰⁵ -> 105 / 4 gives remainder 1. 7¹ = 7 -> Units digit is 7.'
  }
];
