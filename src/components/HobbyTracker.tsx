import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Heart, Plus, Clock, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const HobbyTracker = () => {
  const [newHobby, setNewHobby] = useState("");
  const [hobbies] = useState([
    { id: 1, name: "Reading", timeThisWeek: 420, lastActivity: "2024-01-20" },
    { id: 2, name: "Guitar", timeThisWeek: 300, lastActivity: "2024-01-19" },
    { id: 3, name: "Photography", timeThisWeek: 180, lastActivity: "2024-01-18" },
  ]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const addHobby = () => {
    if (newHobby.trim()) {
      toast.success(`Added ${newHobby} to your hobbies!`);
      setNewHobby("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Heart className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Hobby Tracker</h1>
      </div>

      {/* Add New Hobby */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Hobby</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter hobby name..."
              value={newHobby}
              onChange={(e) => setNewHobby(e.target.value)}
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && addHobby()}
            />
            <Button onClick={addHobby}>
              <Plus className="h-4 w-4 mr-2" />
              Add Hobby
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Time This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15h 0m</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +2h from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Hobbies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hobbies.length}</div>
            <p className="text-xs text-muted-foreground">
              <Heart className="inline h-3 w-3 mr-1" />
              Keep exploring!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Most Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">Reading</div>
            <p className="text-xs text-muted-foreground">
              <Clock className="inline h-3 w-3 mr-1" />
              7h this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hobbies List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Hobbies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {hobbies.map((hobby) => (
              <div
                key={hobby.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <div>
                    <div className="font-medium">{hobby.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Last activity: {new Date(hobby.lastActivity).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <Badge variant="secondary">
                  {formatTime(hobby.timeThisWeek)} this week
                </Badge>
              </div>
            ))}
            {hobbies.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No hobbies added yet. Add your first hobby above!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HobbyTracker;