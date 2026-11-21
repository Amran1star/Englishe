export const WRITING_KINDS = [
  { id: 'sentences', label: 'جمل', min: 20 },
  { id: 'paragraph', label: 'فقرة', min: 50 },
  { id: 'letter', label: 'رسالة', min: 60 },
  { id: 'email', label: 'بريد إلكتروني', min: 50 },
  { id: 'essay', label: 'مقال', min: 150 },
] as const

export type WritingKind = (typeof WRITING_KINDS)[number]['id']

export const WRITING_PROMPTS: Record<WritingKind, string[]> = {
  sentences: ['Write 5 sentences about yourself.', 'Write 5 sentences about your daily routine.', 'Describe your room in 5 sentences.'],
  paragraph: ['Write a paragraph about your best friend.', 'Write a paragraph about your favourite place.', 'Describe your last holiday.'],
  letter: ['Write a letter to a friend inviting him or her to visit your city.', 'Write a letter to thank someone for a gift.'],
  email: ['Write an email to your teacher asking about the homework.', 'Write an email to a hotel asking about booking a room.', 'Write a formal email applying for a job.'],
  essay: ['Is technology making life better? Give reasons and examples.', 'Should students wear school uniforms? Give your opinion.', 'Discuss the advantages and disadvantages of studying abroad.'],
}

export const SCENARIOS = [
  { id: 'airport', label: 'المطار', desc: 'at an airport (check-in, security, boarding)' },
  { id: 'hotel', label: 'الفندق', desc: 'at a hotel (booking, reception, problems with the room)' },
  { id: 'restaurant', label: 'المطعم', desc: 'in a restaurant (ordering, asking about food, paying)' },
  { id: 'university', label: 'الجامعة', desc: 'at university (classes, professors, registration)' },
  { id: 'work', label: 'العمل', desc: 'at work (colleagues, meetings, tasks)' },
  { id: 'shopping', label: 'التسوق', desc: 'shopping (sizes, prices, returns)' },
  { id: 'travel', label: 'السفر', desc: 'planning or taking a trip (transport, directions, sightseeing)' },
  { id: 'introductions', label: 'التعارف', desc: 'meeting someone new and getting to know them' },
  { id: 'daily_life', label: 'الحياة اليومية', desc: 'everyday life (routines, family, hobbies)' },
  { id: 'free', label: 'محادثة حرة', desc: 'any everyday topic the learner chooses' },
] as const
