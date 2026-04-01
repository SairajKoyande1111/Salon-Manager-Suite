import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-serif font-bold text-primary mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">This page could not be found.</p>
        <Link href="/" className="px-6 py-3 bg-secondary text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all inline-block">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
