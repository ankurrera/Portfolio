import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Download, Calendar, TrendingUp } from 'lucide-react';
import { ResumeDownloadLog } from '@/types/socialLinks';

interface ResumeAnalyticsProps {
  refreshTrigger?: number;
}

const ResumeAnalytics = ({ refreshTrigger }: ResumeAnalyticsProps) => {
  const [loading, setLoading] = useState(true);
  const [totalDownloads, setTotalDownloads] = useState(0);
  const [downloadsToday, setDownloadsToday] = useState(0);
  const [downloadsThisWeek, setDownloadsThisWeek] = useState(0);
  const [downloadsThisMonth, setDownloadsThisMonth] = useState(0);
  const [recentLogs, setRecentLogs] = useState<ResumeDownloadLog[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [refreshTrigger]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Get total downloads
      const { count: total, error: totalError } = await supabase
        .from('resume_download_logs')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;
      setTotalDownloads(total || 0);

      // Get today's downloads
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayCount, error: todayError } = await supabase
        .from('resume_download_logs')
        .select('*', { count: 'exact', head: true })
        .gte('downloaded_at', today.toISOString());

      if (todayError) throw todayError;
      setDownloadsToday(todayCount || 0);

      // Get this week's downloads (last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const { count: weekCount, error: weekError } = await supabase
        .from('resume_download_logs')
        .select('*', { count: 'exact', head: true })
        .gte('downloaded_at', weekAgo.toISOString());

      if (weekError) throw weekError;
      setDownloadsThisWeek(weekCount || 0);

      // Get this month's downloads (last 30 days)
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const { count: monthCount, error: monthError } = await supabase
        .from('resume_download_logs')
        .select('*', { count: 'exact', head: true })
        .gte('downloaded_at', monthAgo.toISOString());

      if (monthError) throw monthError;
      setDownloadsThisMonth(monthCount || 0);

      // Get recent logs (last 10)
      const { data: logs, error: logsError } = await supabase
        .from('resume_download_logs')
        .select('*')
        .order('downloaded_at', { ascending: false })
        .limit(10);

      if (logsError) throw logsError;
      setRecentLogs(logs || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Resume Analytics
        </CardTitle>
        <CardDescription>
          Track resume download engagement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 border border-border rounded-lg">
            <div className="text-2xl font-bold">{totalDownloads}</div>
            <div className="text-xs text-muted-foreground mt-1">Total Downloads</div>
          </div>
          <div className="p-4 border border-border rounded-lg">
            <div className="text-2xl font-bold">{downloadsToday}</div>
            <div className="text-xs text-muted-foreground mt-1">Today</div>
          </div>
          <div className="p-4 border border-border rounded-lg">
            <div className="text-2xl font-bold">{downloadsThisWeek}</div>
            <div className="text-xs text-muted-foreground mt-1">Last 7 Days</div>
          </div>
          <div className="p-4 border border-border rounded-lg">
            <div className="text-2xl font-bold">{downloadsThisMonth}</div>
            <div className="text-xs text-muted-foreground mt-1">Last 30 Days</div>
          </div>
        </div>

        {/* Recent Downloads Table */}
        {recentLogs.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Recent Downloads
            </h4>
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 font-medium">Date & Time</th>
                      <th className="text-left p-2 font-medium">Referrer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLogs.map((log, index) => (
                      <tr key={log.id || index} className="border-t border-border">
                        <td className="p-2">
                          {log.downloaded_at
                            ? new Date(log.downloaded_at).toLocaleString()
                            : 'N/A'}
                        </td>
                        <td className="p-2 text-muted-foreground">{log.referrer || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {recentLogs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No downloads recorded yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResumeAnalytics;
