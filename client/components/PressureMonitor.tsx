import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Zap,
  Users,
  Server,
  Clock,
  Database,
  RefreshCw
} from "lucide-react";

interface PressureMetrics {
  overall: number;
  apiUsage: number;
  databaseConnections: number;
  concurrentUsers: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  errorRate: number;
  queueDepth: number;
  timestamp: string;
}

interface UsageAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

interface PerformanceMetric {
  name: string;
  value: number;
  threshold: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'healthy' | 'warning' | 'critical';
  icon: any;
}

// Smart pressure calculation algorithm
const calculatePressureScore = (metrics: Partial<PressureMetrics>): number => {
  const weights = {
    apiUsage: 0.25,
    databaseConnections: 0.20,
    concurrentUsers: 0.15,
    memoryUsage: 0.15,
    cpuUsage: 0.10,
    networkLatency: 0.10,
    errorRate: 0.05
  };

  let totalScore = 0;
  let totalWeight = 0;

  Object.entries(weights).forEach(([key, weight]) => {
    const value = metrics[key as keyof PressureMetrics] as number;
    if (value !== undefined) {
      totalScore += value * weight;
      totalWeight += weight;
    }
  });

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
};

// Generate realistic metrics with smart fluctuations
const generateRealtimeMetrics = (previousMetrics?: PressureMetrics): PressureMetrics => {
  const baseTime = new Date().getHours();
  const isBusinessHours = baseTime >= 9 && baseTime <= 17;
  const multiplier = isBusinessHours ? 1.3 : 0.7;

  // Simulate realistic patterns
  const apiUsage = Math.max(0, Math.min(100, 
    (previousMetrics?.apiUsage || 45) + (Math.random() - 0.5) * 10 * multiplier
  ));
  
  const dbConnections = Math.max(0, Math.min(100,
    (previousMetrics?.databaseConnections || 35) + (Math.random() - 0.5) * 8
  ));
  
  const concurrentUsers = Math.max(0, Math.min(100,
    (previousMetrics?.concurrentUsers || 40) + (Math.random() - 0.5) * 15 * multiplier
  ));
  
  const memoryUsage = Math.max(0, Math.min(100,
    (previousMetrics?.memoryUsage || 60) + (Math.random() - 0.5) * 5
  ));
  
  const cpuUsage = Math.max(0, Math.min(100,
    (previousMetrics?.cpuUsage || 45) + (Math.random() - 0.5) * 12
  ));
  
  const networkLatency = Math.max(0, Math.min(100,
    (previousMetrics?.networkLatency || 25) + (Math.random() - 0.5) * 8
  ));
  
  const errorRate = Math.max(0, Math.min(10,
    (previousMetrics?.errorRate || 0.5) + (Math.random() - 0.5) * 0.3
  ));

  const queueDepth = Math.max(0, Math.min(1000,
    (previousMetrics?.queueDepth || 23) + Math.floor((Math.random() - 0.5) * 10)
  ));

  const metrics = {
    apiUsage,
    databaseConnections: dbConnections,
    concurrentUsers,
    memoryUsage,
    cpuUsage,
    networkLatency,
    errorRate,
    queueDepth,
    overall: 0,
    timestamp: new Date().toISOString()
  };

  metrics.overall = calculatePressureScore(metrics);
  return metrics;
};

export default function PressureMonitor() {
  const [metrics, setMetrics] = useState<PressureMetrics>(generateRealtimeMetrics());
  const [alerts, setAlerts] = useState<UsageAlert[]>([]);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(3000);

  // Performance metrics configuration
  const performanceMetrics: PerformanceMetric[] = [
    {
      name: 'API Usage',
      value: metrics.apiUsage,
      threshold: 80,
      unit: '%',
      trend: metrics.apiUsage > 70 ? 'up' : metrics.apiUsage < 30 ? 'down' : 'stable',
      status: metrics.apiUsage > 85 ? 'critical' : metrics.apiUsage > 70 ? 'warning' : 'healthy',
      icon: Zap
    },
    {
      name: 'Database Load',
      value: metrics.databaseConnections,
      threshold: 75,
      unit: '%',
      trend: metrics.databaseConnections > 60 ? 'up' : 'stable',
      status: metrics.databaseConnections > 80 ? 'critical' : metrics.databaseConnections > 60 ? 'warning' : 'healthy',
      icon: Database
    },
    {
      name: 'Active Users',
      value: metrics.concurrentUsers,
      threshold: 90,
      unit: '%',
      trend: 'up',
      status: metrics.concurrentUsers > 85 ? 'warning' : 'healthy',
      icon: Users
    },
    {
      name: 'Memory Usage',
      value: metrics.memoryUsage,
      threshold: 85,
      unit: '%',
      trend: metrics.memoryUsage > 75 ? 'up' : 'stable',
      status: metrics.memoryUsage > 90 ? 'critical' : metrics.memoryUsage > 75 ? 'warning' : 'healthy',
      icon: Server
    },
    {
      name: 'CPU Usage',
      value: metrics.cpuUsage,
      threshold: 80,
      unit: '%',
      trend: metrics.cpuUsage > 65 ? 'up' : 'stable',
      status: metrics.cpuUsage > 85 ? 'critical' : metrics.cpuUsage > 65 ? 'warning' : 'healthy',
      icon: Activity
    },
    {
      name: 'Network Latency',
      value: metrics.networkLatency,
      threshold: 70,
      unit: 'ms',
      trend: metrics.networkLatency > 40 ? 'up' : 'down',
      status: metrics.networkLatency > 60 ? 'warning' : 'healthy',
      icon: Clock
    }
  ];

  // Generate alerts based on metrics
  const generateAlerts = useCallback((currentMetrics: PressureMetrics, previousMetrics?: PressureMetrics) => {
    const newAlerts: UsageAlert[] = [];

    // Critical pressure alert
    if (currentMetrics.overall > 90) {
      newAlerts.push({
        id: `critical-${Date.now()}`,
        type: 'critical',
        title: 'Critical System Pressure',
        message: `Overall system pressure at ${currentMetrics.overall}%. Immediate attention required.`,
        timestamp: new Date().toISOString(),
        acknowledged: false
      });
    }

    // API usage spike
    if (currentMetrics.apiUsage > 85) {
      newAlerts.push({
        id: `api-${Date.now()}`,
        type: 'warning',
        title: 'High API Usage',
        message: `API usage at ${currentMetrics.apiUsage.toFixed(1)}%. Consider rate limiting.`,
        timestamp: new Date().toISOString(),
        acknowledged: false
      });
    }

    // Memory pressure
    if (currentMetrics.memoryUsage > 90) {
      newAlerts.push({
        id: `memory-${Date.now()}`,
        type: 'critical',
        title: 'Memory Pressure Critical',
        message: `Memory usage at ${currentMetrics.memoryUsage.toFixed(1)}%. Scaling recommended.`,
        timestamp: new Date().toISOString(),
        acknowledged: false
      });
    }

    // Error rate spike
    if (currentMetrics.errorRate > 2) {
      newAlerts.push({
        id: `error-${Date.now()}`,
        type: 'warning',
        title: 'Elevated Error Rate',
        message: `Error rate at ${currentMetrics.errorRate.toFixed(1)}%. Investigating issues.`,
        timestamp: new Date().toISOString(),
        acknowledged: false
      });
    }

    // Queue depth alert
    if (currentMetrics.queueDepth > 100) {
      newAlerts.push({
        id: `queue-${Date.now()}`,
        type: 'warning',
        title: 'Queue Backlog',
        message: `${currentMetrics.queueDepth} items in processing queue. Consider scaling workers.`,
        timestamp: new Date().toISOString(),
        acknowledged: false
      });
    }

    return newAlerts;
  }, []);

  // Real-time monitoring effect
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      setMetrics(previousMetrics => {
        const newMetrics = generateRealtimeMetrics(previousMetrics);
        
        // Generate alerts if needed
        const newAlerts = generateAlerts(newMetrics, previousMetrics);
        if (newAlerts.length > 0) {
          setAlerts(prev => [...newAlerts, ...prev.slice(0, 9)]); // Keep last 10 alerts
        }
        
        return newMetrics;
      });
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isAutoRefresh, refreshInterval, generateAlerts]);

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-green-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getOverallStatus = (pressure: number) => {
    if (pressure > 85) return { status: 'critical', color: 'bg-red-500', text: 'Critical Pressure' };
    if (pressure > 70) return { status: 'warning', color: 'bg-yellow-500', text: 'High Pressure' };
    if (pressure > 50) return { status: 'moderate', color: 'bg-blue-500', text: 'Moderate Load' };
    return { status: 'healthy', color: 'bg-green-500', text: 'Optimal Performance' };
  };

  const overallStatus = getOverallStatus(metrics.overall);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Pressure Monitor</h2>
          <p className="text-gray-600">Real-time performance and usage analytics</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isAutoRefresh ? 'animate-spin' : ''}`} />
            {isAutoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="text-sm border rounded px-2 py-1"
          >
            <option value={1000}>1s</option>
            <option value={3000}>3s</option>
            <option value={5000}>5s</option>
            <option value={10000}>10s</option>
          </select>
        </div>
      </div>

      {/* Overall Pressure Gauge */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Overall System Pressure
              </CardTitle>
              <CardDescription>
                Composite score based on all performance metrics
              </CardDescription>
            </div>
            <Badge className={getStatusColor(overallStatus.status)}>
              {overallStatus.text}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="text-4xl font-bold">{metrics.overall}%</div>
              <div className="flex-1">
                <Progress 
                  value={metrics.overall} 
                  className="h-3"
                  style={{
                    '--progress-background': overallStatus.color
                  } as React.CSSProperties}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Queue Depth:</span>
                <div className="font-medium">{metrics.queueDepth} items</div>
              </div>
              <div>
                <span className="text-gray-600">Error Rate:</span>
                <div className="font-medium">{metrics.errorRate.toFixed(2)}%</div>
              </div>
              <div>
                <span className="text-gray-600">Last Updated:</span>
                <div className="font-medium">{new Date(metrics.timestamp).toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {performanceMetrics.map((metric) => (
          <Card key={metric.name}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <metric.icon className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">{metric.name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(metric.trend)}
                  <Badge className={getStatusColor(metric.status)}>
                    {metric.status}
                  </Badge>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold">
                    {metric.value.toFixed(1)}{metric.unit}
                  </span>
                  <span className="text-sm text-gray-500">
                    / {metric.threshold}{metric.unit}
                  </span>
                </div>
                <Progress 
                  value={(metric.value / metric.threshold) * 100} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Alerts */}
      {alerts.filter(alert => !alert.acknowledged).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-yellow-600" />
              Active Alerts ({alerts.filter(alert => !alert.acknowledged).length})
            </CardTitle>
            <CardDescription>
              System alerts requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.filter(alert => !alert.acknowledged).slice(0, 5).map((alert) => (
                <Alert key={alert.id} className={
                  alert.type === 'critical' ? 'border-red-200 bg-red-50' :
                  alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                  'border-blue-200 bg-blue-50'
                }>
                  <AlertTriangle className="h-4 w-4" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{alert.title}</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ack
                        </Button>
                      </div>
                    </div>
                    <AlertDescription className="mt-1">
                      {alert.message}
                    </AlertDescription>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Smart Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Smart Recommendations</CardTitle>
          <CardDescription>
            AI-powered suggestions based on current system state
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.overall > 80 && (
              <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900">Scale Infrastructure</h4>
                  <p className="text-sm text-red-700">
                    System pressure is critical. Consider adding more server instances or upgrading hardware.
                  </p>
                </div>
              </div>
            )}
            
            {metrics.apiUsage > 75 && (
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                <Zap className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900">Implement Rate Limiting</h4>
                  <p className="text-sm text-yellow-700">
                    API usage is high. Consider implementing stricter rate limiting for free users.
                  </p>
                </div>
              </div>
            )}
            
            {metrics.queueDepth > 50 && (
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Increase Worker Capacity</h4>
                  <p className="text-sm text-blue-700">
                    Processing queue is building up. Consider adding more background workers.
                  </p>
                </div>
              </div>
            )}
            
            {metrics.overall < 40 && (
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">System Running Optimally</h4>
                  <p className="text-sm text-green-700">
                    All systems are performing well. Consider this a good time for maintenance or feature deployment.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
