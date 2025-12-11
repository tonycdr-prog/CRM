import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  FileText,
  Briefcase,
  Receipt,
  Award,
  Wrench,
  Calendar
} from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Link } from "wouter";

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  category: string | null;
  entityType: string | null;
  entityId: string | null;
  read: boolean;
  readAt: string | null;
  actionUrl: string | null;
  createdAt: string;
}

export default function Notifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications", user?.id],
    enabled: !!user?.id,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/notifications/${id}`, { read: true, readAt: new Date().toISOString() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications", user?.id] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => 
        apiRequest("PATCH", `/api/notifications/${n.id}`, { read: true, readAt: new Date().toISOString() })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications", user?.id] });
      toast({ title: "All notifications marked as read" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications", user?.id] });
      toast({ title: "Notification deleted" });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const readNotifications = notifications.filter(n => n.read);
      await Promise.all(readNotifications.map(n => 
        apiRequest("DELETE", `/api/notifications/${n.id}`)
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications", user?.id] });
      toast({ title: "Read notifications cleared" });
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle className="w-5 h-5 text-destructive" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getCategoryIcon = (category: string | null) => {
    switch (category) {
      case 'contract': return <FileText className="w-4 h-4" />;
      case 'job': return <Briefcase className="w-4 h-4" />;
      case 'invoice': return <Receipt className="w-4 h-4" />;
      case 'certification': return <Award className="w-4 h-4" />;
      case 'equipment': return <Wrench className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'read') return n.read;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => markAllReadMutation.mutate()}
            disabled={unreadCount === 0 || markAllReadMutation.isPending}
            data-testid="button-mark-all-read"
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
          <Button 
            variant="outline" 
            onClick={() => clearAllMutation.mutate()}
            disabled={notifications.filter(n => n.read).length === 0 || clearAllMutation.isPending}
            data-testid="button-clear-read"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Read
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">
            All ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread" data-testid="tab-unread">
            Unread ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="read" data-testid="tab-read">
            Read ({notifications.length - unreadCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading notifications...</div>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BellOff className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No notifications</h3>
                <p className="text-muted-foreground">
                  {activeTab === 'unread' ? 'You have no unread notifications' : 'No notifications to display'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <ScrollArea className="h-[600px]">
                <div className="divide-y">
                  {filteredNotifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`p-4 hover-elevate cursor-pointer transition-colors ${!notification.read ? 'bg-primary/5' : ''}`}
                      onClick={() => !notification.read && markReadMutation.mutate(notification.id)}
                      data-testid={`notification-${notification.id}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {getTypeIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <Badge variant="default" className="text-xs">New</Badge>
                            )}
                            {notification.category && (
                              <Badge variant="outline" className="text-xs flex items-center gap-1">
                                {getCategoryIcon(notification.category)}
                                <span className="capitalize">{notification.category}</span>
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(parseISO(notification.createdAt), { addSuffix: true })}
                            </span>
                            <div className="flex items-center gap-2">
                              {notification.actionUrl && (
                                <Button variant="ghost" size="sm" asChild data-testid={`button-view-${notification.id}`}>
                                  <Link href={notification.actionUrl}>View</Link>
                                </Button>
                              )}
                              {!notification.read && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); markReadMutation.mutate(notification.id); }}
                                  data-testid={`button-mark-read-${notification.id}`}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(notification.id); }}
                                data-testid={`button-delete-${notification.id}`}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notification Categories</CardTitle>
          <CardDescription>Types of alerts you may receive</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <FileText className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Contracts</h4>
                <p className="text-xs text-muted-foreground">Renewal reminders, expiring contracts</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Award className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Certifications</h4>
                <p className="text-xs text-muted-foreground">Expiry warnings, renewal due dates</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Wrench className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Equipment</h4>
                <p className="text-xs text-muted-foreground">Calibration due, maintenance reminders</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Briefcase className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Jobs</h4>
                <p className="text-xs text-muted-foreground">Upcoming deadlines, status changes</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Receipt className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Invoices</h4>
                <p className="text-xs text-muted-foreground">Overdue payments, payment received</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Calendar className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Schedule</h4>
                <p className="text-xs text-muted-foreground">Recurring job reminders, appointments</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
