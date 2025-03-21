export const positiveMessages = [
  "Här är din översikt över feedbacken vi har fått. Förresten, {name}, visste du att du är en fantastisk människa?",
  "Välkommen till vår feedback-dashboard, {name}! Kom ihåg att ditt engagemang gör skillnad varje dag.",
  "Kollar du feedback? Det är sånt som exceptionella ledare som du gör, {name}. Fortsätt så!",
  "Ditt engagemang för att förbättras genom feedback visar vilken grym teammedlem du är, {name}.",
  "Dashboarden är full av insikter! Precis som du är full av fantastisk potential, {name}.",
  "En ny dag, en ny chans att förbättra Kumpan, {name}! Låt oss ta vara på denna feedback.",
  "Ditt engagemang för att förstå våra kunder är inspirerande, {name}! Fortsätt det grymma jobbet.",
  "Feedback är en kompass, och du hjälper till att styra Kumpan i rätt riktning, {name}.",
  "Du är bron mellan kundernas feedback och Kumpans utveckling, {name}. Tack för det!",
  "Vem är feedback-mästaren? Det är du, {name}, fortsätt att rocka universum!",
  "Dashboarden är snygg, men ärligt talat så är det ändå du som stjäler showen {name} 😉",
  "Dashboard-vibbar aktiverade! {name}, din storhet lyser praktiskt taget genom skärmen.",
  "Titta på {name} som krossar feedback-spelet—nån borde ge den här hjälten en cape!",
  "Välkommen tillbaka till dashboarden, {name}! Dina awesomeness-nivåer är skyhöga idag.",
  "Kolla på dig, {name}, som hanterar feedback som en mästare—världsdominans är nästa steg, eller hur?",
  "Feedback-centralen, med {name} i huvudrollen! Din briljans lyser, och du är en fantastisk kollega!",
  "Kollar du dashboarden? Bara en vanlig dag för dig, {name}, den otroliga människa vi alla älskar!",
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
