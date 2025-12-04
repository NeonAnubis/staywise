'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from '@/i18n'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Calendar as CalendarIcon,
  Download,
  TrendingUp,
  DollarSign,
  BedDouble,
  Users,
  BarChart3,
  Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface OccupancyReport {
  type: string
  period: { startDate: string; endDate: string }
  totalRooms: number
  averageOccupancy: number
  dailyOccupancy: { date: string; occupancy: number; roomsOccupied: number }[]
  occupancyByDayOfWeek: number[]
  peakOccupancy: number
  lowestOccupancy: number
}

interface RevenueReport {
  type: string
  period: { startDate: string; endDate: string }
  totalRevenue: number
  totalRefunds: number
  netRevenue: number
  transactionCount: number
  averageTransaction: number
  revenueByMethod: Record<string, number>
  dailyRevenue: { date: string; revenue: number }[]
  revenueByHotel: { hotelId: string; hotelName: string; revenue: number }[]
}

interface ReservationsReport {
  type: string
  period: { startDate: string; endDate: string }
  totalReservations: number
  statusBreakdown: Record<string, number>
  averageStay: number
  totalAmount: number
  paidAmount: number
  outstandingAmount: number
  averageReservationValue: number
  dailyReservations: { date: string; count: number }[]
  cancellationRate: number
  noShowRate: number
}

interface FinancialReport {
  type: string
  period: { startDate: string; endDate: string }
  summary: {
    totalPayments: number
    totalRefunds: number
    totalAdjustments: number
    netRevenue: number
  }
  transactionCounts: {
    payments: number
    refunds: number
    adjustments: number
  }
  reservationFinancials: {
    totalBilled: number
    totalCollected: number
    outstanding: number
  }
  paymentStatusBreakdown: Record<string, number>
  chargesByCategory: Record<string, number>
  averagePaymentAmount: number
}

type ReportData = OccupancyReport | RevenueReport | ReservationsReport | FinancialReport | null

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function ReportsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(new Date().setDate(1)),
    to: new Date(),
  })
  const [reportType, setReportType] = useState('occupancy')
  const [report, setReport] = useState<ReportData>(null)
  const [loading, setLoading] = useState(true)
  const [selectedHotelId, setSelectedHotelId] = useState<string>('')
  const [hotels, setHotels] = useState<{ id: string; name: string; code: string }[]>([])

  // Fetch hotels for super admin
  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      fetch('/api/hotels')
        .then(res => res.json())
        .then(data => setHotels(data.hotels || []))
        .catch(console.error)
    }
  }, [user?.role])

  const fetchReport = useCallback(async () => {
    if (!dateRange.from || !dateRange.to) return

    try {
      setLoading(true)
      const params = new URLSearchParams({
        type: reportType,
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
      })
      if (selectedHotelId) {
        params.append('hotelId', selectedHotelId)
      }

      const response = await fetch(`/api/reports?${params}`)
      if (response.ok) {
        const data = await response.json()
        setReport(data.report)
      }
    } catch (error) {
      console.error('Failed to fetch report:', error)
    } finally {
      setLoading(false)
    }
  }, [dateRange.from, dateRange.to, reportType, selectedHotelId])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const occupancyReport = report?.type === 'occupancy' ? report as OccupancyReport : null
  const revenueReport = report?.type === 'revenue' ? report as RevenueReport : null
  const reservationsReport = report?.type === 'reservations' ? report as ReservationsReport : null
  const financialReport = report?.type === 'financial' ? report as FinancialReport : null

  return (
    <div className="space-y-6">
      {/* Background Image */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat opacity-5"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=2070&q=80)'
        }}
      />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('reports.title')}</h1>
          <p className="text-muted-foreground">
            Generate and analyze hotel performance reports
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dateRange.from && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'LLL dd, y')} -{' '}
                          {format(dateRange.to, 'LLL dd, y')}
                        </>
                      ) : (
                        format(dateRange.from, 'LLL dd, y')
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            {user?.role === 'SUPER_ADMIN' && hotels.length > 0 && (
              <Select value={selectedHotelId} onValueChange={setSelectedHotelId}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Hotels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Hotels</SelectItem>
                  {hotels.map(hotel => (
                    <SelectItem key={hotel.id} value={hotel.id}>
                      {hotel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Report Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="occupancy">{t('reports.types.occupancy')}</SelectItem>
                <SelectItem value="revenue">{t('reports.types.revenue')}</SelectItem>
                <SelectItem value="reservations">{t('reports.types.reservations')}</SelectItem>
                <SelectItem value="financial">{t('reports.types.financial')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : !report ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">{t('common.noResults')}</h3>
            <p className="text-muted-foreground">
              No data available for the selected period
            </p>
          </div>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Occupancy Report */}
            {occupancyReport && (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">{t('reports.metrics.occupancyRate')}</CardTitle>
                      <BedDouble className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{occupancyReport.averageOccupancy}%</div>
                      <Progress value={occupancyReport.averageOccupancy} className="mt-2" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
                      <BedDouble className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{occupancyReport.totalRooms}</div>
                      <p className="text-sm text-muted-foreground">Active rooms</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Peak Occupancy</CardTitle>
                      <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{occupancyReport.peakOccupancy}%</div>
                      <p className="text-sm text-muted-foreground">Highest in period</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Lowest Occupancy</CardTitle>
                      <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{occupancyReport.lowestOccupancy}%</div>
                      <p className="text-sm text-muted-foreground">Lowest in period</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Occupancy Pattern</CardTitle>
                    <CardDescription>Average occupancy by day of week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-7 gap-4">
                      {occupancyReport.occupancyByDayOfWeek.map((rate, idx) => (
                        <div key={idx} className="text-center">
                          <div className="text-sm font-medium mb-2">{dayNames[idx]}</div>
                          <div className="relative h-32 bg-muted rounded-lg overflow-hidden">
                            <div
                              className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-lg transition-all"
                              style={{ height: `${rate}%` }}
                            />
                          </div>
                          <div className="text-lg font-bold mt-2">{rate}%</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Revenue Report */}
            {revenueReport && (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">{t('reports.metrics.totalRevenue')}</CardTitle>
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">${revenueReport.totalRevenue.toLocaleString()}</div>
                      <p className="text-sm text-muted-foreground">Gross revenue</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
                      <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">${revenueReport.netRevenue.toLocaleString()}</div>
                      <p className="text-sm text-muted-foreground">After refunds</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Refunds</CardTitle>
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-600">${revenueReport.totalRefunds.toLocaleString()}</div>
                      <p className="text-sm text-muted-foreground">Total refunded</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
                      <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">${revenueReport.averageTransaction.toLocaleString()}</div>
                      <p className="text-sm text-muted-foreground">{revenueReport.transactionCount} transactions</p>
                    </CardContent>
                  </Card>
                </div>

                {revenueReport.revenueByHotel.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Revenue by Hotel</CardTitle>
                      <CardDescription>Breakdown by property</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {revenueReport.revenueByHotel.map((hotel) => (
                        <div key={hotel.hotelId} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{hotel.hotelName}</span>
                            <span className="text-xl font-bold">${hotel.revenue.toLocaleString()}</span>
                          </div>
                          <Progress
                            value={(hotel.revenue / revenueReport.totalRevenue) * 100}
                            className="h-3"
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                      {Object.entries(revenueReport.revenueByMethod).map(([method, amount]) => (
                        <div key={method} className="space-y-2">
                          <span className="text-sm font-medium">{method.replace('_', ' ')}</span>
                          <p className="text-2xl font-bold">${amount.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Reservations Report */}
            {reservationsReport && (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">{t('reports.metrics.totalReservations')}</CardTitle>
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{reservationsReport.totalReservations}</div>
                      <p className="text-sm text-muted-foreground">In selected period</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">{t('reports.metrics.averageStay')}</CardTitle>
                      <BedDouble className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{reservationsReport.averageStay}</div>
                      <p className="text-sm text-muted-foreground">nights average</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Avg Reservation Value</CardTitle>
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">${reservationsReport.averageReservationValue.toLocaleString()}</div>
                      <p className="text-sm text-muted-foreground">Per booking</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-600">${reservationsReport.outstandingAmount.toLocaleString()}</div>
                      <p className="text-sm text-muted-foreground">Pending payment</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
                    <CardHeader>
                      <CardTitle className="text-green-700 dark:text-green-400">Confirmed</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold text-green-700 dark:text-green-400">
                        {reservationsReport.statusBreakdown.CONFIRMED || 0}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-500">
                        {reservationsReport.totalReservations > 0
                          ? (((reservationsReport.statusBreakdown.CONFIRMED || 0) / reservationsReport.totalReservations) * 100).toFixed(1)
                          : 0}% of total
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900">
                    <CardHeader>
                      <CardTitle className="text-yellow-700 dark:text-yellow-400">Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold text-yellow-700 dark:text-yellow-400">
                        {reservationsReport.statusBreakdown.PENDING || 0}
                      </p>
                      <p className="text-sm text-yellow-600 dark:text-yellow-500">
                        {reservationsReport.totalReservations > 0
                          ? (((reservationsReport.statusBreakdown.PENDING || 0) / reservationsReport.totalReservations) * 100).toFixed(1)
                          : 0}% of total
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900">
                    <CardHeader>
                      <CardTitle className="text-red-700 dark:text-red-400">Cancelled</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold text-red-700 dark:text-red-400">
                        {reservationsReport.statusBreakdown.CANCELLED || 0}
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-500">
                        {reservationsReport.cancellationRate}% cancellation rate
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {/* Financial Report */}
            {financialReport && (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">
                        ${financialReport.summary.totalPayments.toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {financialReport.transactionCounts.payments} transactions
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-600">
                        ${financialReport.summary.totalRefunds.toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {financialReport.transactionCounts.refunds} refunds
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
                      <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        ${financialReport.summary.netRevenue.toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">After refunds</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                      <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-600">
                        ${financialReport.reservationFinancials.outstanding.toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">Unpaid balance</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Status Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(financialReport.paymentStatusBreakdown).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <span className="font-medium capitalize">{status.toLowerCase()}</span>
                          <span className="text-xl font-bold">{count}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Charges by Category</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(financialReport.chargesByCategory).map(([category, amount]) => (
                        <div key={category} className="flex items-center justify-between">
                          <span className="font-medium">{category}</span>
                          <span className="text-xl font-bold">${amount.toLocaleString()}</span>
                        </div>
                      ))}
                      {Object.keys(financialReport.chargesByCategory).length === 0 && (
                        <p className="text-muted-foreground">No charges recorded</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            {occupancyReport && (
              <Card>
                <CardHeader>
                  <CardTitle>Daily Occupancy</CardTitle>
                  <CardDescription>Day by day breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {occupancyReport.dailyOccupancy.map((day) => (
                      <div key={day.date} className="flex items-center justify-between py-2 border-b">
                        <span>{format(new Date(day.date), 'EEE, MMM dd')}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">{day.roomsOccupied} rooms</span>
                          <span className="font-bold w-12 text-right">{day.occupancy}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {revenueReport && (
              <Card>
                <CardHeader>
                  <CardTitle>Daily Revenue</CardTitle>
                  <CardDescription>Day by day breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {revenueReport.dailyRevenue.map((day) => (
                      <div key={day.date} className="flex items-center justify-between py-2 border-b">
                        <span>{format(new Date(day.date), 'EEE, MMM dd')}</span>
                        <span className="font-bold">${day.revenue.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {reservationsReport && (
              <Card>
                <CardHeader>
                  <CardTitle>Daily Reservations</CardTitle>
                  <CardDescription>Reservations created per day</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {reservationsReport.dailyReservations.map((day) => (
                      <div key={day.date} className="flex items-center justify-between py-2 border-b">
                        <span>{format(new Date(day.date), 'EEE, MMM dd')}</span>
                        <span className="font-bold">{day.count} reservations</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {financialReport && (
              <Card>
                <CardHeader>
                  <CardTitle>Financial Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2">Reservation Financials</h4>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Billed</p>
                        <p className="text-xl font-bold">${financialReport.reservationFinancials.totalBilled.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Collected</p>
                        <p className="text-xl font-bold text-green-600">${financialReport.reservationFinancials.totalCollected.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Outstanding</p>
                        <p className="text-xl font-bold text-orange-600">${financialReport.reservationFinancials.outstanding.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Average Payment</h4>
                    <p className="text-2xl font-bold">${financialReport.averagePaymentAmount.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
