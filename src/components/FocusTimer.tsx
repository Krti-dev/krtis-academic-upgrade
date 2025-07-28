import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Clock, 
  Coffee, 
  Brain,
  Settings,
  Volume2,
  VolumeX
} from "lucide-react";
import { toast } from "sonner";

const FocusTimer = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<"focus" | "shortBreak" | "longBreak">("focus");
  const [session, setSession] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const modes = {
    focus: { duration: 25 * 60, label: "Focus Time", color: "primary", icon: Brain },
    shortBreak: { duration: 5 * 60, label: "Short Break", color: "success", icon: Coffee },
    longBreak: { duration: 15 * 60, label: "Long Break", color: "info", icon: Coffee },
  };

  const currentMode = modes[mode];
  const progress = ((currentMode.duration - timeLeft) / currentMode.duration) * 100;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            handleTimerComplete();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleTimerComplete = () => {
    setIsActive(false);
    
    if (soundEnabled) {
      // Play notification sound (you could add actual audio here)
      toast.success("Timer completed!");
    }

    if (mode === "focus") {
      if (session % 4 === 0) {
        setMode("longBreak");
        toast.success("Great work! Time for a long break.");
      } else {
        setMode("shortBreak");
        toast.success("Focus session complete! Take a short break.");
      }
      setSession(prev => prev + 1);
    } else {
      setMode("focus");
      toast.success("Break over! Ready for another focus session?");
    }
    
    setTimeLeft(modes[mode === "focus" ? (session % 4 === 0 ? "longBreak" : "shortBreak") : "focus"].duration);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
    toast.info(isActive ? "Timer paused" : "Timer started");
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(currentMode.duration);
    toast.info("Timer reset");
  };

  const switchMode = (newMode: typeof mode) => {
    setMode(newMode);
    setTimeLeft(modes[newMode].duration);
    setIsActive(false);
  };

  const Icon = currentMode.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Focus Timer</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Timer */}
        <div className="lg:col-span-2">
          <Card className={`bg-gradient-to-br from-${currentMode.color}/5 to-${currentMode.color}/10 border-${currentMode.color}/20`}>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Icon className="h-6 w-6" />
                {currentMode.label}
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Session {session} • {mode === "focus" ? "Focus" : "Break"} Mode
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Timer Display */}
              <div className="text-center">
                <div className="text-8xl md:text-9xl font-bold font-mono tracking-tighter">
                  {formatTime(timeLeft)}
                </div>
                <Progress value={progress} className="mt-4 h-3" />
              </div>

              {/* Timer Controls */}
              <div className="flex justify-center gap-4">
                <Button onClick={toggleTimer} size="lg" className="flex-1 max-w-32">
                  {isActive ? (
                    <>
                      <Pause className="h-5 w-5 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      Start
                    </>
                  )}
                </Button>
                <Button onClick={resetTimer} variant="outline" size="lg">
                  <RotateCcw className="h-5 w-5" />
                </Button>
                <Button 
                  onClick={() => setSoundEnabled(!soundEnabled)} 
                  variant="outline" 
                  size="lg"
                >
                  {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </Button>
              </div>

              {/* Mode Switcher */}
              <Tabs value={mode} onValueChange={(value) => switchMode(value as typeof mode)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="focus">Focus</TabsTrigger>
                  <TabsTrigger value="shortBreak">Short Break</TabsTrigger>
                  <TabsTrigger value="longBreak">Long Break</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Stats & Settings */}
        <div className="space-y-6">
          {/* Today's Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today's Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Focus Sessions</span>
                  <Badge variant="outline">{session - 1} / 8</Badge>
                </div>
                <Progress value={((session - 1) / 8) * 100} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Focus Time</span>
                  <span className="font-medium">{(session - 1) * 25}m</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Break Time</span>
                  <span className="font-medium">{Math.floor((session - 1) * 6.25)}m</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Sound Notifications</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                  >
                    {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm font-medium">Quick Durations</span>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setTimeLeft(15 * 60);
                        setIsActive(false);
                      }}
                    >
                      15m
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setTimeLeft(25 * 60);
                        setIsActive(false);
                      }}
                    >
                      25m
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setTimeLeft(45 * 60);
                        setIsActive(false);
                      }}
                    >
                      45m
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setTimeLeft(60 * 60);
                        setIsActive(false);
                      }}
                    >
                      60m
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="bg-gradient-to-br from-info/5 to-info/10 border-info/20">
            <CardHeader>
              <CardTitle className="text-lg text-info">💡 Focus Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Eliminate distractions before starting</li>
                <li>• Take deep breaths during breaks</li>
                <li>• Stay hydrated throughout your session</li>
                <li>• Complete 4 focus sessions for optimal results</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FocusTimer;