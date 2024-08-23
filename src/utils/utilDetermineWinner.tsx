// Helper function to determine the winner
export const utilDetermineWinner = (
  userChoice: string,
  serverChoice: string
): string => {
  if (userChoice === serverChoice) {
    return "tied";
  }

  if (
    (userChoice === "rock" && serverChoice === "scissors") ||
    (userChoice === "scissors" && serverChoice === "paper") ||
    (userChoice === "paper" && serverChoice === "rock")
  ) {
    return "won";
  }

  return "lost";
};
