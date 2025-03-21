export const positiveMessages = [
  "This is your dashboard overview of the feedback we have gotten. Btw, {name}, did you know that you are a wonderful human being?",
  "Welcome to your feedback dashboard, {name}! Remember, your dedication makes a real difference every day.",
  "Checking in on feedback? That's what exceptional leaders like you do, {name}. Keep up the great work!",
  "Your commitment to improving through feedback shows what an amazing team member you are, {name}.",
  "Dashboard loaded with insights! Just like you're loaded with awesome potential, {name}.",
  "Reviewing feedback is a sign of growth. And {name}, you're absolutely crushing it!",
  "Another day, another opportunity to improve Kumpan, {name}! Let's make the most of this feedback.",
  "Your commitment to understanding our clients is inspiring, {name}! Keep up the great work.",
  "Feedback is a compass, and you're helping steer Kumpan in the right direction, {name}.",
  "You're the bridge between client feedback and Kumpan's evolution, {name}. Thank you!",
  "Who's the feedback master? That'd be you {name},keep rocking the universe!",
  "The dashboard's dashing, but let's be real, you're the one stealing the show {name}!",
  "Dashboard vibes activated! {name}, your greatness is practically glowing through the screen.",
  "Look at {name} go, crushing the feedback game—someone get this hero a cape!",
  "Welcome back to the dashboard, {name}! Your awesomeness levels are off the charts today.",
  "Look at you, {name}, tackling feedback like a champ—world domination is next, right?",
  "Feedback central, starring {name}! Your brilliance is basically lighting up the screen.",
  "Hey {name}, checking the dashboard? Just another day being the incredible human we all adore!",
];

export function getRandomPositiveMessage(name?: string): string {
  const randomIndex = Math.floor(Math.random() * positiveMessages.length);
  let message = positiveMessages[randomIndex];

  if (name) {
    message = message.replace(/{name}/g, name);
  } else {
    message = message.replace(/{name}/g, "");
  }

  return message;
}
