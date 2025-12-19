import { ReactNode } from "react";

export default function HubShell(props: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const { title, description, children } = props;

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="text-2xl font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      {children}
    </div>
  );
}
