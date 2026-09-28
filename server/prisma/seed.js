import prisma from '../src/db/prisma.js';

const mentorsData = [
  { id: 'mentor-1', name: 'Arjun Sharma', email: 'arjun.sharma@codeyoung.com', timezone: 'Asia/Kolkata', active: true, workStartHour: 9, workEndHour: 21 },
  { id: 'mentor-2', name: 'Priya Nair', email: 'priya.nair@codeyoung.com', timezone: 'Asia/Kolkata', active: true, workStartHour: 9, workEndHour: 21 },
  { id: 'mentor-3', name: 'Rohan Gupta', email: 'rohan.gupta@codeyoung.com', timezone: 'Asia/Kolkata', active: true, workStartHour: 9, workEndHour: 21 },
  { id: 'mentor-4', name: 'Ananya Desai', email: 'ananya.desai@codeyoung.com', timezone: 'Asia/Kolkata', active: true, workStartHour: 9, workEndHour: 21 },
  { id: 'mentor-5', name: 'Vikram Patel', email: 'vikram.patel@codeyoung.com', timezone: 'Asia/Kolkata', active: true, workStartHour: 9, workEndHour: 21 },
  { id: 'mentor-6', name: 'Neha Sen', email: 'neha.sen@codeyoung.com', timezone: 'Asia/Kolkata', active: true, workStartHour: 9, workEndHour: 21 },
  { id: 'mentor-7', name: 'Rahul Verma', email: 'rahul.verma@codeyoung.com', timezone: 'Asia/Kolkata', active: true, workStartHour: 9, workEndHour: 21 },
  { id: 'mentor-8', name: 'Kavita Joshi', email: 'kavita.joshi@codeyoung.com', timezone: 'Asia/Kolkata', active: true, workStartHour: 9, workEndHour: 21 },
  { id: 'mentor-9', name: 'Deepak Rao', email: 'deepak.rao@codeyoung.com', timezone: 'Asia/Kolkata', active: true, workStartHour: 9, workEndHour: 21 },
  { id: 'mentor-10', name: 'Sneha Mukherjee', email: 'sneha.mukherjee@codeyoung.com', timezone: 'Asia/Kolkata', active: true, workStartHour: 9, workEndHour: 21 },
];

export async function seedMentors() {
  console.log('Seeding 10 trial class mentors...');

  for (const mentor of mentorsData) {
    await prisma.mentor.upsert({
      where: { email: mentor.email },
      update: {
        name: mentor.name,
        timezone: mentor.timezone,
        active: mentor.active,
        workStartHour: mentor.workStartHour,
        workEndHour: mentor.workEndHour,
      },
      create: mentor,
    });
  }

  const count = await prisma.mentor.count();
  console.log(`Successfully seeded/ensured ${count} mentors in database.`);
}

if (process.argv[1]?.endsWith('seed.js')) {
  seedMentors()
    .catch((e) => {
      console.error('Error during seeding:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
