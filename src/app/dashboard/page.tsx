"use client";

import * as React from 'react';
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { fetchDashboardExpirationCardStats, fetchMonthlyExpirationChartData, fetchLicenseSubmissionStats, fetchCriticalExpirationStats, fetchTodayProcessingStats, fetchDispensaryPerformanceStats, fetchDispensaryPerformanceSummary } from '@/services/patientService';
import { fetchChatDashboardMonthlyMetrics } from '@/services/chatService';
import type { ExpirationDataPoint, SubmissionStats, MonthlyTrendItem, DashboardExpirationCardStats, MonthlyLocationBreakdown, ChatDashboardTodayMetrics, ChatStatusDistributionItem, ChartConfig as AppChartConfig, CriticalExpirationStats, TodayProcessingStats, DispensaryPerformance } from '@/types'; // Renamed ChartConfig to AppChartConfig
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LabelList } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, CalendarClock, MessageCircle, Mail, Smartphone, PhoneCall, Settings2, PlusCircle, FileText, Loader2, AlertTriangle, TrendingUp, Award, Star, Activity, MapPin, TrendingDown, Minus, MessageSquareHeart, CheckCircle2, Clock, BarChartHorizontalBig, Zap, MoreHorizontal, LineChart } from "lucide-react";
import Link from 'next/link';
import { format, parseISO, addMonths, getMonth, getYear, isValid, subMonths, startOfMonth } from 'date-fns';
import { dummyActivityLog } from "@/lib/dummy-data"; 

// New Color Palette
const PALETTE = {
  primaryBlue: "#3B82F6", // For primary data series, 'Open' chat status
  emeraldGreen: "#10B981", // For positive metrics, 'Renewed' pie slice, 'Solved' chat status, Renewal counts
  purple: "#8B5CF6", // For New License counts
  amber: "#F59E0B",  // For 'Pending' chat status
  red: "#EF4444",    // For negative metrics, 'Expired Patients', 'Unread' chat status
  cyan: "#06B6D4",   // For Busiest Hour icon
  lightGray: "#E5E7EB", // For neutral parts like 'Not Renewed' in pie
  mediumGray: "#9CA3AF", // For default/other statuses
};

const expirationChartConfig: AppChartConfig = {
  patients: {
    label: "Patients",
    color: PALETTE.primaryBlue,
  },
};

const renewalChartConfig: AppChartConfig = {
  count: { label: 'Renewals', color: PALETTE.emeraldGreen }
};
const newLicenseChartConfig: AppChartConfig = {
  count: { label: 'New Licenses', color: PALETTE.purple }
};

const combinedSubmissionTrendChartConfig: AppChartConfig = {
  renewals: { label: "Renewals", color: PALETTE.emeraldGreen },
  newLicenses: { label: "New Licenses", color: PALETTE.purple }, 
};

const getStatusColor = (status: string): string => {
  const lowerStatus = status.toLowerCase();
  switch (lowerStatus) {
    case 'open': return PALETTE.primaryBlue;
    case 'solved':
    case 'resolved': return PALETTE.emeraldGreen;
    case 'unread': return PALETTE.red;
    case 'pending': return PALETTE.amber;
    default: return PALETTE.mediumGray;
  }
};

const activityIcons = {
  email: <Mail className="h-4 w-4" />,
  sms: <Smartphone className="h-4 w-4" />,
  call: <PhoneCall className="h-4 w-4" />,
  visit: <Users className="h-4 w-4" />,
  system: <Settings2 className="h-4 w-4" />,
};

export default function DashboardPage() {
  const [liveStats, setLiveStats] = React.useState<DashboardExpirationCardStats>({
    expiredPatients: 0,
    expiringIn30Days: 0,
    expiringIn60Days: 0,
    expiringIn90Days: 0,
    renewalRatePercentage: 0,
  });
  const [isLoadingLiveStats, setIsLoadingLiveStats] = React.useState(true);
  const [liveStatsError, setLiveStatsError] = React.useState<string | null>(null);
  
  // NEW: Critical expiration stats
  const [criticalStats, setCriticalStats] = React.useState<CriticalExpirationStats>({
    expiringNext7Days: 0,
    expiringNext48Hours: 0,
    expiringToday: 0,
    expiredYesterday: 0,
  });
  const [isLoadingCriticalStats, setIsLoadingCriticalStats] = React.useState(true);
  const [criticalStatsError, setCriticalStatsError] = React.useState<string | null>(null);
  
  // NEW: Today's processing stats
  const [todayStats, setTodayStats] = React.useState<TodayProcessingStats>({
    renewalsCompletedToday: 0,
    newLicensesProcessedToday: 0,
    totalProcessedToday: 0,
    pendingToday: 0,
    renewalsSubmittedToday: 0,
    newLicensesSubmittedToday: 0,
    totalSubmittedToday: 0,
    processingRatePercentage: 0,
    inProgressSubmissionsToday: 0,
    reviewSubmissionsToday: 0,
    failedSubmissionsToday: 0
  });
  const [isLoadingTodayStats, setIsLoadingTodayStats] = React.useState(true);
  const [todayStatsError, setTodayStatsError] = React.useState<string | null>(null);
  
  // NEW: Dispensary performance stats
  const [dispensaryPerformance, setDispensaryPerformance] = React.useState<DispensaryPerformance[]>([]);
  const [isLoadingDispensaryPerformance, setIsLoadingDispensaryPerformance] = React.useState(true);
  const [dispensaryPerformanceError, setDispensaryPerformanceError] = React.useState<string | null>(null);
  
  // NEW: Dispensary performance summary
  const [dispensaryPerformanceSummary, setDispensaryPerformanceSummary] = React.useState<{
    totalDispensaries: number;
    bestRenewalRate: number;
    bestRenewalDispensary: string;
    mostActiveCount: number;
    mostActiveDispensary: string;
    avgProcessingDaysOverall: number;
    totalSubmissionsPeriod: number;
    periodStart: string;
    periodEnd: string;
  }>({ 
    totalDispensaries: 0, bestRenewalRate: 0, bestRenewalDispensary: 'N/A', 
    mostActiveCount: 0, mostActiveDispensary: 'N/A', avgProcessingDaysOverall: 0,
    totalSubmissionsPeriod: 0, periodStart: '', periodEnd: ''
  });
  const [isLoadingDispensaryPerformanceSummary, setIsLoadingDispensaryPerformanceSummary] = React.useState(true);
  const [dispensaryPerformanceSummaryError, setDispensaryPerformanceSummaryError] = React.useState<string | null>(null);
  

  
  const [expirationChartData, setExpirationChartData] = React.useState<ExpirationDataPoint[]>([]);
  const [isLoadingExpirationChartData, setIsLoadingExpirationChartData] = React.useState(true);
  const [expirationChartError, setExpirationChartError] = React.useState<string | null>(null);
  
  const [submissionStats, setSubmissionStats] = React.useState<SubmissionStats | null>(null);
  const [isLoadingSubmissionStats, setIsLoadingSubmissionStats] = React.useState(true);
  const [submissionStatsError, setSubmissionStatsError] = React.useState<string | null>(null);
  
  const [summarySubmissionMetrics, setSummarySubmissionMetrics] = React.useState<{
    totalSubmissions: number;
    topLocation: { name: string; count: number } | null;
    monthlyAverage: number;
  } | null>(null);
  const [locationSubmissionChartData, setLocationSubmissionChartData] = React.useState<any[]>([]);
  const [locationChartConfig, setLocationChartConfig] = React.useState<AppChartConfig>({});
  const [sortedLocationKeysForChart, setSortedLocationKeysForChart] = React.useState<string[]>([]);
  const [combinedTrendData, setCombinedTrendData] = React.useState<MonthlyTrendItem[]>([]);

  const [chatMetrics, setChatMetrics] = React.useState<ChatDashboardTodayMetrics | null>(null);
  const [isLoadingChatMetrics, setIsLoadingChatMetrics] = React.useState(true);
  const [chatMetricsError, setChatMetricsError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoadingLiveStats(true);
      setLiveStatsError(null);
      setIsLoadingExpirationChartData(true);
      setExpirationChartError(null);
      setIsLoadingSubmissionStats(true);
      setSubmissionStatsError(null);
      setIsLoadingChatMetrics(true);
      setChatMetricsError(null);
      
      // NEW: Initialize new loading states
      setIsLoadingCriticalStats(true);
      setCriticalStatsError(null);
      setIsLoadingTodayStats(true);
      setTodayStatsError(null);
      setIsLoadingDispensaryPerformance(true);
      setDispensaryPerformanceError(null);
      setIsLoadingDispensaryPerformanceSummary(true);
      setDispensaryPerformanceSummaryError(null);

      try {
        const fetchedCardStats = await fetchDashboardExpirationCardStats();
        setLiveStats(fetchedCardStats);
        
        console.log("[Dashboard] Fetched card stats:", fetchedCardStats);
        console.log("[Dashboard] Renewal rate percentage:", fetchedCardStats.renewalRatePercentage);
        
      } catch (e: any) {
        setLiveStatsError("Failed to load patient expiration statistics.");
        console.error("[Dashboard] Error fetching dashboard card stats:", e);
        setLiveStats({ expiredPatients: 0, expiringIn30Days: 0, expiringIn60Days: 0, expiringIn90Days: 0, renewalRatePercentage: 0 });
      } finally {
        setIsLoadingLiveStats(false);
      }
      
      // NEW: Fetch critical expiration stats
      try {
        const fetchedCriticalStats = await fetchCriticalExpirationStats();
        setCriticalStats(fetchedCriticalStats);
        console.log("[Dashboard] Fetched critical stats:", fetchedCriticalStats);
      } catch (e: any) {
        setCriticalStatsError("Failed to load critical expiration statistics.");
        console.error("[Dashboard] Error fetching critical stats:", e);
      } finally {
        setIsLoadingCriticalStats(false);
      }
      
      // NEW: Fetch today's processing stats
      try {
        const fetchedTodayStats = await fetchTodayProcessingStats();
        setTodayStats(fetchedTodayStats);
        console.log("[Dashboard] Fetched today stats:", fetchedTodayStats);
      } catch (e: any) {
        setTodayStatsError("Failed to load today's processing statistics.");
        console.error("[Dashboard] Error fetching today stats:", e);
      } finally {
        setIsLoadingTodayStats(false);
      }
      
      // NEW: Fetch dispensary performance stats
      try {
        const [fetchedDispensaryPerformance, fetchedDispensaryPerformanceSummary] = await Promise.all([
          fetchDispensaryPerformanceStats(),
          fetchDispensaryPerformanceSummary()
        ]);
        setDispensaryPerformance(fetchedDispensaryPerformance);
        setDispensaryPerformanceSummary(fetchedDispensaryPerformanceSummary);
        console.log("[Dashboard] Fetched dispensary performance:", fetchedDispensaryPerformance);
        console.log("[Dashboard] Fetched dispensary summary:", fetchedDispensaryPerformanceSummary);
      } catch (e: any) {
        setDispensaryPerformanceError("Failed to load dispensary performance statistics.");
        setDispensaryPerformanceSummaryError("Failed to load dispensary performance summary.");
        console.error("[Dashboard] Error fetching dispensary performance:", e);
      } finally {
        setIsLoadingDispensaryPerformance(false);
        setIsLoadingDispensaryPerformanceSummary(false);
      }

      try {
        const fetchedChartData = await fetchMonthlyExpirationChartData();
        setExpirationChartData(fetchedChartData);
      } catch (e) {
        setExpirationChartError("Failed to load data for expiration chart.");
        console.error("[Dashboard] Error fetching monthly expiration chart data:", e);
      } finally {
        setIsLoadingExpirationChartData(false);
      }
      
      console.log("Dashboard: Attempting to fetch submission stats...");
      try {
        const fetchedSubmissionStats = await fetchLicenseSubmissionStats();
        console.log("Dashboard: Fetched submission stats object from service:", fetchedSubmissionStats);
        setSubmissionStats(fetchedSubmissionStats);

        if (fetchedSubmissionStats && fetchedSubmissionStats.allLocationsMonthlyBreakdown && fetchedSubmissionStats.allLocationsMonthlyBreakdown.length > 0) {
            const breakdown = fetchedSubmissionStats.allLocationsMonthlyBreakdown;
            let totalSubmissions = 0;
            const submissionsByLocation: Record<string, number> = {};
            
            const uniqueLocations = new Set<string>();
            const uniqueMonthKeys = new Set<string>();

            breakdown.forEach(item => {
                const itemTotal = item.renewals + item.newLicenses;
                totalSubmissions += itemTotal;
                submissionsByLocation[item.location] = (submissionsByLocation[item.location] || 0) + itemTotal;
                uniqueLocations.add(item.location);
                if (item.monthKey) uniqueMonthKeys.add(item.monthKey); 
            });
            
            let topLocationStat = null;
            if (Object.keys(submissionsByLocation).length > 0) {
                const topLocName = Object.entries(submissionsByLocation).sort(([,a],[,b]) => b-a)[0][0];
                topLocationStat = { name: topLocName, count: submissionsByLocation[topLocName] };
            }

            const numberOfMonths = uniqueMonthKeys.size > 0 ? uniqueMonthKeys.size : 1; 
            setSummarySubmissionMetrics({
                totalSubmissions,
                topLocation: topLocationStat,
                monthlyAverage: Math.round(totalSubmissions / numberOfMonths)
            });

            const monthKeysForChart = Array.from(uniqueMonthKeys).sort();
            const chartData = monthKeysForChart.map(monthKey => {
                const monthEntry: any = { 
                    month: breakdown.find(b => b.monthKey === monthKey)?.month || format(parseISO(monthKey + "-01"), "MMM yy"),
                    monthKey 
                };
                Array.from(uniqueLocations).forEach(loc => monthEntry[loc] = 0);
                return monthEntry;
            });

            breakdown.forEach(item => {
                const monthData = chartData.find(cd => cd.monthKey === item.monthKey);
                if (monthData) {
                     monthData[item.location] = (monthData[item.location] || 0) + item.renewals + item.newLicenses;
                }
            });
            setLocationSubmissionChartData(chartData);
            
            const locConfig: AppChartConfig = {};
            const baseChartColors = [PALETTE.primaryBlue, PALETTE.emeraldGreen, PALETTE.purple, PALETTE.amber, PALETTE.cyan, PALETTE.red, PALETTE.mediumGray, '#FF69B4', '#7FFFD4', '#D2691E']; 
            
            const locationTotals: Record<string, number> = {};
            Array.from(uniqueLocations).forEach(loc => {
              locationTotals[loc] = chartData.reduce((sum, monthData) => sum + (monthData[loc] || 0), 0);
            });
            
            const sortedLocKeys = Array.from(uniqueLocations).sort((a, b) => locationTotals[a] - locationTotals[b]); 
            setSortedLocationKeysForChart(sortedLocKeys);

            sortedLocKeys.forEach((loc, index) => { 
                locConfig[loc] = { label: loc, color: baseChartColors[index % baseChartColors.length] };
            });
            setLocationChartConfig(locConfig);

        } else {
             setLocationSubmissionChartData([]);
             setLocationChartConfig({});
             setSortedLocationKeysForChart([]);
             setSummarySubmissionMetrics({ totalSubmissions: 0, topLocation: null, monthlyAverage: 0});
        }

        const combinedDataMap: Record<string, MonthlyTrendItem> = {};
        const allMonthKeysForCombined = new Set<string>();

        (fetchedSubmissionStats?.renewalStats?.monthlyTrend || []).forEach(item => allMonthKeysForCombined.add(item.monthKey));
        (fetchedSubmissionStats?.newLicenseStats?.monthlyTrend || []).forEach(item => allMonthKeysForCombined.add(item.monthKey));
        
        const sortedMonthKeysForCombined = Array.from(allMonthKeysForCombined).sort();

        sortedMonthKeysForCombined.forEach(monthKey => {
            const renewalSample = fetchedSubmissionStats?.renewalStats?.monthlyTrend.find(it => it.monthKey === monthKey);
            const newLicenseSample = fetchedSubmissionStats?.newLicenseStats?.monthlyTrend.find(it => it.monthKey === monthKey);
            const sampleItem = renewalSample || newLicenseSample; 
            combinedDataMap[monthKey] = { 
                month: sampleItem ? sampleItem.month : format(parseISO(monthKey + '-01'), 'MMM yy'), 
                monthKey, 
                renewals: 0, 
                newLicenses: 0,
                total: 0,
             };
        });
        (fetchedSubmissionStats?.renewalStats?.monthlyTrend || []).forEach(item => {
            if (combinedDataMap[item.monthKey]) {
                combinedDataMap[item.monthKey].renewals = item.count;
                combinedDataMap[item.monthKey].total += item.count;
            }
        });
        (fetchedSubmissionStats?.newLicenseStats?.monthlyTrend || []).forEach(item => {
             if (combinedDataMap[item.monthKey]) {
                combinedDataMap[item.monthKey].newLicenses = item.count;
                combinedDataMap[item.monthKey].total += item.count;
            }
        });
        const finalCombinedData = sortedMonthKeysForCombined.map(monthKey => combinedDataMap[monthKey]).filter(item => item !== undefined);
        setCombinedTrendData(finalCombinedData);

      } catch (e) {
        console.error("[Dashboard] Error fetching or processing submission stats:", e);
        setSubmissionStatsError("Failed to load license submission statistics.");
      } finally {
        setIsLoadingSubmissionStats(false);
      }

      try {
        const fetchedChatMetrics = await fetchChatDashboardMonthlyMetrics();
        setChatMetrics(fetchedChatMetrics);
      } catch (e) {
        setChatMetricsError("Failed to load chat analytics.");
        console.error("[Dashboard] Error fetching chat monthly metrics:", e);
      } finally {
        setIsLoadingChatMetrics(false);
      }
    };
    loadDashboardData();
  }, []); 
  
  React.useEffect(() => {
    if (!isLoadingSubmissionStats) {
        console.log("Dashboard: Final submissionStats object being used by UI:", submissionStats);
        console.log("Dashboard: Summary Submission Metrics:", summarySubmissionMetrics);
        console.log("Dashboard: Location Submission Chart Data:", locationSubmissionChartData);
        console.log("Dashboard: Sorted Location Keys for Chart:", sortedLocationKeysForChart);
        console.log("Dashboard: Location Chart Config:", locationChartConfig);
        console.log("Dashboard: Combined Trend Data for Chart:", combinedTrendData);
    }
  }, [submissionStats, isLoadingSubmissionStats, summarySubmissionMetrics, locationSubmissionChartData, sortedLocationKeysForChart, locationChartConfig, combinedTrendData]);

  const activityLog = dummyActivityLog.slice(0, 5); 

  const renderStatCardContent = (value: number | string | undefined, description: string, loading: boolean, error?: string | null) => {
    if (loading) {
      return <Loader2 className="h-6 w-6 animate-spin text-primary my-2" />;
    }
    if (error) {
        return <p className="text-xs text-destructive my-2">{error}</p>;
    }
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '' && value !== '0')) {
      return <p className="text-sm text-muted-foreground my-2">Data unavailable</p>;
    }
    return (
      <>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </>
    );
  };
  
  const renewalRatePieData = React.useMemo(() => {
    if (!liveStats || typeof liveStats.renewalRatePercentage !== 'number') {
      return [{ name: 'Data Unavailable', value: 100, fill: PALETTE.lightGray }];
    }
    return [
      { name: 'Renewed', value: liveStats.renewalRatePercentage, fill: PALETTE.emeraldGreen },
      { name: 'Not Renewed', value: 100 - liveStats.renewalRatePercentage, fill: PALETTE.lightGray },
    ];
  }, [liveStats]);

  const chatStatusChartConfig = React.useMemo(() => {
    if (!chatMetrics?.statusDistribution) return {};
    const config: AppChartConfig = {};
    chatMetrics.statusDistribution.forEach(item => {
        config[item.status] = { label: item.status, color: getStatusColor(item.status) };
    });
    return config;
  }, [chatMetrics]);

  const statusDistributionChartData = React.useMemo(() => {
    if (!chatMetrics?.statusDistribution || chatMetrics.statusDistribution.length === 0) return [];
    return chatMetrics.statusDistribution
      .map(item => ({ name: item.status, value: item.count, fill: getStatusColor(item.status) }))
      .filter(item => item.value > 0); 
  }, [chatMetrics, chatStatusChartConfig]);

  return (
    <AppLayout>
      <div className="space-y-6 px-6 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

        {(liveStatsError || expirationChartError || submissionStatsError || chatMetricsError || criticalStatsError || todayStatsError || dispensaryPerformanceError) && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle /> Error Loading Dashboard Data
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {liveStatsError && <p>Patient Expiration Stats: {liveStatsError}</p>}
              {expirationChartError && <p>Expiration Chart: {expirationChartError}</p>}
              {submissionStatsError && <p>License Submission Stats: {submissionStatsError}</p>}
              {chatMetricsError && <p>Chat Analytics: {chatMetricsError}</p>}
              {criticalStatsError && <p>Critical Expiration Stats: {criticalStatsError}</p>}
              {todayStatsError && <p>Today's Processing Stats: {todayStatsError}</p>}
              {dispensaryPerformanceError && <p>Dispensary Performance: {dispensaryPerformanceError}</p>}
              <p className="mt-2 text-muted-foreground">Some dashboard statistics may be unavailable or inaccurate.</p>
            </CardContent>
          </Card>
        )}

        {/* Urgencia Operacional Section - NUEVOS CARDS CRÍTICOS */}
        <h2 className="text-2xl font-semibold tracking-tight pt-4">🚨 Urgencia Operacional</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-red-500/70 bg-red-50/50 dark:bg-red-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximos 7 Días</CardTitle>
              <CalendarClock className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              {renderStatCardContent(criticalStats.expiringNext7Days, "Requieren llamada URGENTE", isLoadingCriticalStats, criticalStatsError)}
            </CardContent>
            <CardFooter>
              <Link href="/patients?exp=7days" className="w-full" passHref>
                <Button variant="outline" size="sm" className="w-full text-red-600 border-red-500 hover:bg-red-500/10">Llamar Ahora</Button>
              </Link>
            </CardFooter>
          </Card>
          
          <Card className="border-orange-500/70 bg-orange-50/50 dark:bg-orange-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximas 48 Horas</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              {renderStatCardContent(criticalStats.expiringNext48Hours, "Crítico - Hoy/Mañana", isLoadingCriticalStats, criticalStatsError)}
            </CardContent>
            <CardFooter>
              <Link href="/patients?exp=48hours" className="w-full" passHref>
                <Button variant="outline" size="sm" className="w-full text-orange-600 border-orange-500 hover:bg-orange-500/10">Contactar HOY</Button>
              </Link>
            </CardFooter>
          </Card>
          
          <Card className="border-green-500/70 bg-green-50/50 dark:bg-green-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Renovaciones Hoy</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {renderStatCardContent(todayStats.renewalsSubmittedToday, "Submissions recibidas hoy", isLoadingTodayStats, todayStatsError)}
            </CardContent>
            <CardFooter>
              <Link href="/admin/submissions?filter=today&type=renewal" className="w-full" passHref>
                <Button variant="outline" size="sm" className="w-full text-green-600 border-green-500 hover:bg-green-500/10">Ver Detalles</Button>
              </Link>
            </CardFooter>
          </Card>
          
          <Card className="border-blue-500/70 bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nuevas Licencias Hoy</CardTitle>
              <Star className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {renderStatCardContent(todayStats.newLicensesSubmittedToday, "Submissions nuevas recibidas hoy", isLoadingTodayStats, todayStatsError)}
            </CardContent>
            <CardFooter>
              <Link href="/admin/submissions?filter=today&type=new" className="w-full" passHref>
                <Button variant="outline" size="sm" className="w-full text-blue-600 border-blue-500 hover:bg-blue-500/10">Ver Submissions</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>

        {/* Performance por Dispensario */}
        <Card className="lg:col-span-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-primary"/>Performance por Dispensario (Últimos 3 Meses)</CardTitle>
            <CardDescription>Análisis de eficiencia operacional por ubicación - Datos optimizados y simplificados.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingDispensaryPerformance || isLoadingDispensaryPerformanceSummary ? (
              <div className="flex items-center justify-center h-[350px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Cargando performance optimizada...</span>
              </div>
            ) : (dispensaryPerformanceError || dispensaryPerformanceSummaryError) ? (
              <div className="p-4 border rounded-lg bg-destructive/10 text-destructive flex items-center gap-2 h-[350px]">
                <AlertTriangle className="h-5 w-5" /> 
                <div>
                  <p>{dispensaryPerformanceError}</p>
                  {dispensaryPerformanceSummaryError && <p>{dispensaryPerformanceSummaryError}</p>}
                </div>
              </div>
            ) : dispensaryPerformance.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">Total Dispensarios</CardTitle></CardHeader>
                    <CardContent><p className="text-3xl font-bold">{dispensaryPerformanceSummary.totalDispensaries}</p></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">Mejor Tasa Renovación</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{dispensaryPerformanceSummary.bestRenewalRate}%</p>
                      <p className="text-sm text-muted-foreground">{dispensaryPerformanceSummary.bestRenewalDispensary}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">Más Activo</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{dispensaryPerformanceSummary.mostActiveCount}</p>
                      <p className="text-sm text-muted-foreground">{dispensaryPerformanceSummary.mostActiveDispensary}</p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Información del período */}
                {dispensaryPerformanceSummary.periodStart && dispensaryPerformanceSummary.periodEnd && (
                  <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    📊 Análisis del período: {format(parseISO(dispensaryPerformanceSummary.periodStart), 'dd MMM yyyy')} - {format(parseISO(dispensaryPerformanceSummary.periodEnd), 'dd MMM yyyy')} 
                    | Total submissions analizadas: {dispensaryPerformanceSummary.totalSubmissionsPeriod.toLocaleString()}
                  </div>
                )}
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dispensario</TableHead>
                      <TableHead>Tasa Renovación</TableHead>
                      <TableHead>Total Renovaciones</TableHead>
                      <TableHead>Licencias Nuevas</TableHead>
                      <TableHead>Total Submissions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dispensaryPerformance.map((dispensary, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{dispensary.dispensaryName}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            dispensary.renewalRate >= 70 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                            dispensary.renewalRate >= 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                            'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                          }`}>
                            {dispensary.renewalRate}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-green-600">{dispensary.totalRenewals}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-blue-600">{dispensary.totalNewLicenses}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">{dispensary.totalSubmissions}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground h-[350px] flex items-center justify-center">
                No hay datos de performance disponibles para los últimos 3 meses.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Patient & License Analytics Section */}
        <h2 className="text-2xl font-semibold tracking-tight pt-4">Patient & License Analytics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-destructive/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired Patients</CardTitle>
              <CalendarClock className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              {renderStatCardContent(liveStats.expiredPatients, "Licenses already expired", isLoadingLiveStats, liveStatsError)}
            </CardContent>
             <CardFooter>
               <Link href="/patients?exp=expired" className="w-full" passHref>
                <Button variant="outline" size="sm" className="w-full text-destructive border-destructive hover:bg-destructive/10">View Patients</Button>
               </Link>
            </CardFooter>
          </Card>
          <Card className="border-accent/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring in 30 Days</CardTitle>
              <CalendarClock className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              {renderStatCardContent(liveStats.expiringIn30Days, "Calls Needed Urgently", isLoadingLiveStats, liveStatsError)}
            </CardContent>
            <CardFooter>
               <Link href="/patients?exp=30days" className="w-full" passHref>
                <Button variant="outline" size="sm" className="w-full text-accent border-accent hover:bg-accent/10">View Patients</Button>
               </Link>
            </CardFooter>
          </Card>
          <Card className="border-blue-500/50 dark:border-blue-400/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring in 60 Days</CardTitle>
              <CalendarClock className="h-4 w-4" style={{color: PALETTE.primaryBlue}}/>
            </CardHeader>
            <CardContent>
              {renderStatCardContent(liveStats.expiringIn60Days, "Email + SMS Stage", isLoadingLiveStats, liveStatsError)}
            </CardContent>
             <CardFooter>
               <Link href="/patients?exp=60days" className="w-full" passHref>
                <Button variant="outline" size="sm" className="w-full" style={{borderColor: PALETTE.primaryBlue, color:PALETTE.primaryBlue}}>View Patients</Button>
               </Link>
            </CardFooter>
          </Card>
          <Card className="border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring in 90 Days</CardTitle>
              <CalendarClock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {renderStatCardContent(liveStats.expiringIn90Days, "Initial Email Stage", isLoadingLiveStats, liveStatsError)}
            </CardContent>
             <CardFooter>
                <Link href="/patients?exp=90days" className="w-full" passHref>
                 <Button variant="outline" size="sm" className="w-full text-primary border-primary hover:bg-primary/10">View Patients</Button>
                </Link>
            </CardFooter>
          </Card>
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>License Expirations by Month</CardTitle>
              <CardDescription>Number of patient licenses expiring each month (current & next 5 months).</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              {isLoadingExpirationChartData ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading chart data...</span>
                </div>
              ) : expirationChartError && expirationChartData.length === 0 ? (
                 <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Could not load expiration chart data.
                </div>
              ): expirationChartData.length === 0 ? (
                 <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No expiration data available for the upcoming months.
                </div>
              ) : (
                <ChartContainer config={expirationChartConfig} className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={expirationChartData} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8} />
                      <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="patients" fill="var(--color-patients)" radius={4}>
                        <LabelList dataKey="patients" position="top" className="fill-foreground text-xs" formatter={(value: number) => value > 0 ? value : ''}/>
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Current Month Renewal Rate</CardTitle>
              <CardDescription>Based on renewals submitted this month for licenses expiring this month.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-[300px]">
               {isLoadingLiveStats ? ( 
                <div className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                   <span className="ml-2">Loading...</span>
                </div>
              ) : liveStatsError ? (
                 <div className="text-destructive text-center">Could not load renewal rate. {liveStatsError}</div>
              ) : typeof liveStats.renewalRatePercentage === 'number' ? (
                <>
                  <div className="relative h-40 w-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={renewalRatePieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                          startAngle={90}
                          endAngle={-270}
                        >
                          {renewalRatePieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold" style={{color: PALETTE.emeraldGreen}}>{liveStats.renewalRatePercentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-center text-muted-foreground">
                    Percentage of patients who renewed out of those whose licenses were due this month.
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center">Renewal rate data unavailable.</p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* License Submission Analytics Section */}
        <Card className="lg:col-span-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary"/>Submission Activity Insights (Last 4 Months)</CardTitle>
                <CardDescription>Monthly renewal and new license submissions for each dispensary location.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSubmissionStats ? (
                 <div className="flex items-center justify-center h-[350px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Loading submission activity...</span>
                </div>
              ) : submissionStatsError ? (
                  <div className="p-4 border rounded-lg bg-destructive/10 text-destructive flex items-center gap-2 h-[350px]">
                      <AlertTriangle className="h-5 w-5" /> <p>{submissionStatsError}</p>
                  </div>
              ) : summarySubmissionMetrics && locationSubmissionChartData.length > 0 && Object.keys(locationChartConfig).length > 0 && sortedLocationKeysForChart.length > 0 ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-base">Total Submissions</CardTitle></CardHeader>
                            <CardContent><p className="text-3xl font-bold">{summarySubmissionMetrics.totalSubmissions}</p></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-base">Top Location</CardTitle></CardHeader>
                            <CardContent>
                                {summarySubmissionMetrics.topLocation ? (
                                    <p className="text-3xl font-bold">{summarySubmissionMetrics.topLocation.name} <span className="text-lg">({summarySubmissionMetrics.topLocation.count})</span></p>
                                ) : (
                                    <p className="text-lg text-muted-foreground">N/A</p>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-base">Monthly Average</CardTitle></CardHeader>
                            <CardContent><p className="text-3xl font-bold">{summarySubmissionMetrics.monthlyAverage} <span className="text-lg">/month</span></p></CardContent>
                        </Card>
                    </div>
                    <ChartContainer config={locationChartConfig} className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={locationSubmissionChartData} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8}/>
                                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8}/>
                                <ChartTooltip content={<ChartTooltipContent indicator="dashed"/>}/>
                                <ChartLegend content={<ChartLegendContent className="flex-wrap justify-center gap-x-4 gap-y-1 text-xs"/>} />
                                {sortedLocationKeysForChart.map(locKey => (
                                    <Bar key={locKey} dataKey={locKey} fill={`var(--color-${locKey})`} radius={4} stackId="a">
                                      <LabelList 
                                        dataKey={locKey} 
                                        position="insideStack" 
                                        className={`text-xs ${locKey.toUpperCase() === 'BAYAMON' ? 'fill-foreground' : 'fill-primary-foreground'}`}
                                        formatter={(value: number) => value > 0 ? value : ''}
                                      />
                                    </Bar>
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </div>
              ) : (
                  <p className="text-sm text-muted-foreground h-[350px] flex items-center justify-center">
                      No submission breakdown data available for the last 4 months.
                  </p>
              )}
            </CardContent>
             <CardFooter>
                   <Link href="/admin/submissions" className="w-full" passHref>
                    <Button variant="outline" size="sm" className="w-full">View All Submissions</Button>
                   </Link>
            </CardFooter>
        </Card>

        <Card className="lg:col-span-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary"/>Overall Submission Trends (Last 4 Months)</CardTitle>
                <CardDescription>Monthly count of all 'Renewal Medical License' and 'New Medical License' submissions.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                {isLoadingSubmissionStats ? (
                    <div className="h-[300px] flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2">Loading trend data...</span>
                    </div>
                ) : submissionStatsError ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        Could not load submission trend data. {submissionStatsError}
                    </div>
                ) : combinedTrendData.length > 0 && combinedTrendData.some(m => (m.total || 0) > 0) ? (
                    <ChartContainer config={combinedSubmissionTrendChartConfig} className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={combinedTrendData} margin={{ top: 20, right: 20, left: -20, bottom: 5 }} barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                                <ChartLegend content={<ChartLegendContent />} />
                                <Bar dataKey="renewals" fill="var(--color-renewals)" radius={4} stackId="a">
                                    <LabelList dataKey="renewals" position="insideStack" className="fill-primary-foreground text-xs" formatter={(value: number) => value > 0 ? value : ''} />
                                </Bar>
                                <Bar dataKey="newLicenses" fill="var(--color-newLicenses)" radius={4} stackId="a">
                                     <LabelList dataKey="newLicenses" position="insideStack" className="fill-primary-foreground text-xs" formatter={(value: number) => value > 0 ? value : ''} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                ) : (
                    <p className="text-sm text-muted-foreground h-[300px] flex items-center justify-center">
                        No overall submission trend data available for the last 4 months.
                    </p>
                )}
            </CardContent>
             <CardFooter>
                   <Link href="/admin/submissions" className="w-full" passHref>
                    <Button variant="outline" size="sm" className="w-full">View All Submissions</Button>
                   </Link>
            </CardFooter>
        </Card>


        {/* WhatsApp Analytics Section */}
        <h2 className="text-2xl font-semibold tracking-tight pt-6 border-t">WhatsApp Conversation Analytics (This Month)</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-blue-500/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conversations This Month</CardTitle>
              <MessageCircle className="h-4 w-4" style={{color: PALETTE.primaryBlue}} />
            </CardHeader>
            <CardContent>
              {renderStatCardContent(chatMetrics?.totalConversationsToday, "Active conversations this month", isLoadingChatMetrics, chatMetricsError)}
            </CardContent>
            <CardFooter>
               <Link href="/chat" passHref>
                <Button variant="outline" size="sm" className="w-full text-blue-600 border-blue-500 hover:bg-blue-500/10">View Conversations</Button>
               </Link>
            </CardFooter>
          </Card>
          <Card className="border-green-500/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Rate This Month</CardTitle>
              <MessageSquareHeart className="h-4 w-4" style={{color: PALETTE.emeraldGreen}} />
            </CardHeader>
            <CardContent>
              {renderStatCardContent(chatMetrics && typeof chatMetrics.responseRateToday === 'number' ? `${chatMetrics.responseRateToday.toFixed(1)}%` : undefined, "Conversations with a reply this month", isLoadingChatMetrics, chatMetricsError)}
            </CardContent>
             <CardFooter>
                 <Button variant="outline" size="sm" className="w-full text-green-600 border-green-500 hover:bg-green-500/10">View Details</Button>
            </CardFooter>
          </Card>
          <Card className="border-orange-500/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Response Time This Month</CardTitle>
              <Clock className="h-4 w-4" style={{color: PALETTE.amber}} />
            </CardHeader>
            <CardContent>
              {renderStatCardContent(chatMetrics && typeof chatMetrics.avgResponseTimeMinutes === 'number' ? `${chatMetrics.avgResponseTimeMinutes.toFixed(1)} min` : undefined, "For first 'to' message this month", isLoadingChatMetrics, chatMetricsError)}
            </CardContent>
             <CardFooter>
                 <Button variant="outline" size="sm" className="w-full text-orange-600 border-orange-500 hover:bg-orange-500/10">Analyze Responses</Button>
            </CardFooter>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
           <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Status Distribution (This Month)</CardTitle>
              <CardDescription>Breakdown of conversation statuses active this month.</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px] flex items-center justify-center">
            {isLoadingChatMetrics ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : chatMetricsError ? (
                <p className="text-destructive">{chatMetricsError}</p>
            ) : statusDistributionChartData.length > 0 ? (
                <ChartContainer config={chatStatusChartConfig} className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie data={statusDistributionChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                        {statusDistributionChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Pie>
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <ChartLegend content={<ChartLegendContent nameKey="name" wrapperStyle={{fontSize: '0.75rem'}}/>} />
                    </PieChart>
                </ResponsiveContainer>
                </ChartContainer>
            ) : (
                <p className="text-muted-foreground">No status data for this month.</p>
            )}
            </CardContent>
          </Card>
          <Card className="border-purple-500/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Message Volume (This Month)</CardTitle>
              <BarChartHorizontalBig className="h-4 w-4" style={{color: PALETTE.purple}} />
            </CardHeader>
            <CardContent className="space-y-2">
                {renderStatCardContent(chatMetrics?.totalMessagesToday, "Total messages this month", isLoadingChatMetrics, chatMetricsError)}
                {isLoadingChatMetrics ? <Loader2 className="h-5 w-5 animate-spin"/> : !chatMetricsError && chatMetrics && (
                    <div className="text-xs text-muted-foreground">
                        <p>Sent: {chatMetrics.sentMessagesToday}</p>
                        <p>Received: {chatMetrics.receivedMessagesToday}</p>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <Button variant="outline" size="sm" className="w-full text-purple-600 border-purple-500 hover:bg-purple-500/10">View Message Logs</Button>
            </CardFooter>
          </Card>
        </div>

        <Card className="border-teal-500/50"> 
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Busiest Hour (This Month)</CardTitle>
                <Zap className="h-4 w-4" style={{color: PALETTE.cyan}} />
            </CardHeader>
            <CardContent>
                 {isLoadingChatMetrics ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary my-2" />
                 ) : chatMetricsError ? (
                    <p className="text-xs text-destructive my-2">{chatMetricsError}</p>
                 ): chatMetrics && chatMetrics.busiestHourToday && chatMetrics.busiestHourToday !== 'No data' ? (
                    <>
                    <div className="text-2xl font-bold">
                        {chatMetrics.busiestHourToday}
                    </div>
                    <p className="text-xs text-muted-foreground">Peak activity hour this month</p>
                    </>
                 ) : (
                    <p className="text-sm text-muted-foreground my-2">No message data for busiest hour this month.</p>
                 )}
            </CardContent>
        </Card>

        {/* Recent Activity and Quick Actions Section */}
        <div className="grid gap-4 grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" />Recent Activity</CardTitle>
              <CardDescription>Latest actions and system events.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Type</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Patient/User</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityLog.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="text-muted-foreground">
                        {activityIcons[activity.type as keyof typeof activityIcons]}
                      </TableCell>
                      <TableCell>{activity.details}</TableCell>
                      <TableCell>{activity.patient || activity.user || '-'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{activity.time}</TableCell>
                      <TableCell>
                        {activity.status && (
                           <span className={`px-2 py-1 text-xs rounded-full ${
                            activity.status === 'completed' || activity.status === 'sent' || activity.status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                            activity.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                            'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          }`}>
                            {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {activityLog.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24">No recent activity.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="ml-auto">View All Activity <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks at your fingertips.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="justify-start text-left"><FileText className="mr-2 h-4 w-4" />Generate Reports</Button>
              <Link href="/automations" passHref>
                <Button variant="outline" className="justify-start text-left w-full"><MessageCircle className="mr-2 h-4 w-4" />Manage Templates</Button>
              </Link>
              <Link href="/patients?exp=soon" passHref>
                <Button variant="outline" className="justify-start text-left w-full"><CalendarClock className="mr-2 h-4 w-4" />View Expiring Soon</Button>
              </Link>
              <Link href="/patients/new" passHref> 
                <Button variant="outline" className="justify-start text-left w-full"><PlusCircle className="mr-2 h-4 w-4" />Add New Patient</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

      </div>
    </AppLayout>
  );
}