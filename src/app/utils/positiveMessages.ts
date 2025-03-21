export const positiveMessages = [
  "This is your dashboard overview of the feedback we have gotten. Btw, {name}, did you know that you are a wonderful human being?",
  "Welcome to your feedback dashboard, {name}! Remember, your dedication makes a real difference every day.",
  "Checking in on feedback? That's what exceptional leaders like you do, {name}. Keep up the great work!",
  "Your commitment to improving through feedback shows what an amazing team member you are, {name}.",
  "Dashboard loaded with insights! Just like you're loaded with awesome potential, {name}.",
  "Reviewing feedback is a sign of growth. And {name}, you're absolutely crushing it!",
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
