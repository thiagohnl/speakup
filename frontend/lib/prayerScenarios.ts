import { PrayerScenario } from '@/types';

export const PRAYER_SCENARIOS: PrayerScenario[] = [
  {
    id: 'open-service',
    label: 'Open the Sunday Service',
    setting: 'Sunday morning, full congregation (60+ people), pastor has just asked you to open in prayer. The service is about to begin.',
    duration: '1.5-2 minutes',
    tips: ['Set a tone of reverence', 'Invite the congregation into prayer, not just observe it', 'Keep it focused — one or two themes max']
  },
  {
    id: 'close-service',
    label: 'Close the Sunday Service',
    setting: 'End of service, people are ready to leave. Pastor asks you to close in prayer. Energy should send people out with purpose.',
    duration: '1-1.5 minutes',
    tips: ['Summarise what was preached briefly in the prayer if relevant', 'Commission the congregation for the week', 'End with energy, not trailing off']
  },
  {
    id: 'before-communion',
    label: 'Prayer Before Communion',
    setting: 'The church is about to take communion together. You are asked to pray before the elements are distributed.',
    duration: '1-2 minutes',
    tips: ['Focus on Christ and the cross', 'Create reverence and stillness', 'Avoid being too long — people are waiting to participate']
  },
  {
    id: 'prayer-for-sick',
    label: 'Prayer for Someone Who is Sick',
    setting: 'A member of the congregation has shared a health struggle. Pastor invites you to pray for them publicly.',
    duration: '1-2 minutes',
    tips: ['Speak to God, not about the person to the congregation', 'Be specific but not clinical', 'Pray with faith and compassion in equal measure']
  },
  {
    id: 'announcements',
    label: 'Give Church Announcements',
    setting: 'You have 3 announcements to share before the sermon. Congregation is seated and attentive.',
    duration: '2-3 minutes',
    tips: ['State each announcement clearly: What, When, Who it is for', 'Keep energy up — announcements can drag', 'End with a brief connecting line before handing back to the pastor']
  },
  {
    id: 'open-prayer-meeting',
    label: 'Open a Prayer Meeting',
    setting: 'Mid-week prayer gathering, 15-20 people. You are opening the time of prayer.',
    duration: '2 minutes',
    tips: ['Set the tone for others to pray after you', 'Invite participation — do not dominate', 'Keep it conversational, not performative']
  }
];
