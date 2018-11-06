class MatchingResponse {
  email: string;
  matches: boolean;
  score: number;

  constructor(email: string, matches: boolean, score: number) {
    this.email = email;
    this.matches = matches;
    this.score = score;
  }
}

const emails = [
  "rsmartin@msn.com",
  "facet@msn.com",
  "eabrown@mac.com",
  "pappp@mac.com",
  "mglee@msn.com",
  "dartlife@att.net",
  "duchamp@optonline.net",
  "dhrakar@yahoo.com",
  "bahwi@gmail.com",
  "bmorrow@sbcglobal.net",
  "blixem@sbcglobal.net",
  "jrifkin@verizon.net",
  "faceglee@verizon.net"
];

console.log(getMatchingEmailsFor("face", "glee", emails));

function getMatchingEmailsFor(firstName, lastName, emails) {
  return emails
    .map(email => matchFirstNameLastNameToEmail("face", "glee", email))
    .filter(matchingResponse => matchingResponse.matches == true);
}

function matchFirstNameLastNameToEmail(
  firstName,
  lastName,
  email
): MatchingResponse {
  const lowerCasedFirstName = firstName.toLowerCase();
  const lowerCasedLastName = lastName.toLowerCase();
  const firstPartOfEmail = email
    .substring(0, email.lastIndexOf("@") + 1)
    .toLowerCase();

  const firstNameMatch = firstPartOfEmail.includes(lowerCasedFirstName);
  const lastNameMatch = firstPartOfEmail.includes(lowerCasedLastName);

  let score = 0;
  [firstNameMatch, lastNameMatch].map(match => {
    if (match) {
      score += 1;
    }
  });
  return new MatchingResponse(email, firstNameMatch || lastNameMatch, score);
}
