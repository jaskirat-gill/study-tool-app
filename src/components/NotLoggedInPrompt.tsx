import Link from "next/link";
import { Button } from "./ui/button";

const NotLoggedInPrompt = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold">Please Log In</h1>
        <p className="text-muted-foreground">
          You need to be logged in to view your study sets.
        </p>
        <Button asChild>
          <Link href="/login">Log In</Link>
        </Button>
      </div>
    </div>
  );
}

export default NotLoggedInPrompt;