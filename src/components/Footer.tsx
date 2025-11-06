export const Footer = () => {
  return (
    <footer className="border-t glass-card mt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-muted-foreground">Built by students, for students.</p>
          <p className="text-xs text-muted-foreground">© 2025 DecodeAI × EduPrompt.</p>
        </div>
        <div className="mt-6 pt-6 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground">Educational use only.</p>
        </div>
      </div>
    </footer>
  );
};
