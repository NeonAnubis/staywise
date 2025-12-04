'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from '@/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
  Download,
} from 'lucide-react'
import { format } from 'date-fns'

interface Transaction {
  id: string
  amount: number
  type: string
  paymentMethod: string
  paymentStatus: string
  reference: string | null
  description: string | null
  reservation: {
    code: string
    guest: {
      firstName: string
      lastName: string
    }
  } | null
  processedBy: {
    firstName: string
    lastName: string
  }
  createdAt: string
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500',
  PARTIAL: 'bg-orange-500',
  PAID: 'bg-green-500',
  REFUNDED: 'bg-purple-500',
  CANCELLED: 'bg-red-500',
}

const methodIcons: Record<string, React.ReactNode> = {
  CASH: <Banknote className="h-4 w-4" />,
  CREDIT_CARD: <CreditCard className="h-4 w-4" />,
  DEBIT_CARD: <CreditCard className="h-4 w-4" />,
  BANK_TRANSFER: <ArrowUpRight className="h-4 w-4" />,
  PIX: <ArrowDownRight className="h-4 w-4" />,
}

export default function FinancialPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    type: 'PAYMENT',
    paymentMethod: 'CASH',
    reference: '',
    description: '',
    reservationId: '',
  })

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions')
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      })

      if (response.ok) {
        toast({
          title: t('common.success'),
          description: 'Transaction recorded successfully',
        })
        setIsDialogOpen(false)
        resetForm()
        fetchTransactions()
      } else {
        const data = await response.json()
        toast({
          title: t('common.error'),
          description: data.error || 'Failed to record transaction',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: t('common.error'),
        description: 'An error occurred',
        variant: 'destructive',
      })
    }
  }

  const resetForm = () => {
    setFormData({
      amount: '',
      type: 'PAYMENT',
      paymentMethod: 'CASH',
      reference: '',
      description: '',
      reservationId: '',
    })
  }

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.reservation?.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.reservation?.guest.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.reservation?.guest.lastName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || tx.type === typeFilter
    return matchesSearch && matchesType
  })

  const summaryData = {
    totalRevenue: transactions
      .filter(t => t.type === 'PAYMENT' && t.paymentStatus === 'PAID')
      .reduce((sum, t) => sum + t.amount, 0),
    totalRefunds: transactions
      .filter(t => t.type === 'REFUND')
      .reduce((sum, t) => sum + t.amount, 0),
    pendingPayments: transactions
      .filter(t => t.paymentStatus === 'PENDING')
      .reduce((sum, t) => sum + t.amount, 0),
    transactionCount: transactions.length,
  }

  return (
    <div className="space-y-6">
      {/* Background Image */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat opacity-5"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=2070&q=80)'
        }}
      />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('financial.title')}</h1>
          <p className="text-muted-foreground">
            Manage financial transactions and payments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('financial.addTransaction')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('financial.addTransaction')}</DialogTitle>
                <DialogDescription>
                  Record a new financial transaction
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">{t('financial.amount')}</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">{t('financial.type')}</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PAYMENT">{t('financial.types.payment')}</SelectItem>
                          <SelectItem value="REFUND">{t('financial.types.refund')}</SelectItem>
                          <SelectItem value="ADJUSTMENT">{t('financial.types.adjustment')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">{t('financial.paymentMethod')}</Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">{t('financial.methods.cash')}</SelectItem>
                        <SelectItem value="CREDIT_CARD">{t('financial.methods.creditCard')}</SelectItem>
                        <SelectItem value="DEBIT_CARD">{t('financial.methods.debitCard')}</SelectItem>
                        <SelectItem value="BANK_TRANSFER">{t('financial.methods.bankTransfer')}</SelectItem>
                        <SelectItem value="PIX">{t('financial.methods.pix')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference">{t('financial.reference')}</Label>
                    <Input
                      id="reference"
                      value={formData.reference}
                      onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                      placeholder="Transaction reference"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">{t('financial.description')}</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Transaction description..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit">
                    {t('common.save')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-100">
              Total Revenue
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-green-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${summaryData.totalRevenue.toLocaleString()}</div>
            <p className="text-sm text-green-100">Paid transactions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-100">
              Total Refunds
            </CardTitle>
            <TrendingDown className="h-5 w-5 text-red-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${summaryData.totalRefunds.toLocaleString()}</div>
            <p className="text-sm text-red-100">Refunded amount</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-yellow-100">
              Pending Payments
            </CardTitle>
            <DollarSign className="h-5 w-5 text-yellow-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${summaryData.pendingPayments.toLocaleString()}</div>
            <p className="text-sm text-yellow-100">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">
              Transactions
            </CardTitle>
            <CreditCard className="h-5 w-5 text-blue-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summaryData.transactionCount}</div>
            <p className="text-sm text-blue-100">This period</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by reference, reservation code, or guest..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PAYMENT">{t('financial.types.payment')}</SelectItem>
                <SelectItem value="REFUND">{t('financial.types.refund')}</SelectItem>
                <SelectItem value="ADJUSTMENT">{t('financial.types.adjustment')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>{t('financial.reference')}</TableHead>
                <TableHead>Reservation</TableHead>
                <TableHead>{t('financial.type')}</TableHead>
                <TableHead>{t('financial.paymentMethod')}</TableHead>
                <TableHead>{t('financial.amount')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>Processed By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    {format(new Date(tx.createdAt), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="font-medium">{tx.reference || '-'}</TableCell>
                  <TableCell>
                    {tx.reservation ? (
                      <div>
                        <p className="font-medium">{tx.reservation.code}</p>
                        <p className="text-sm text-muted-foreground">
                          {tx.reservation.guest.firstName} {tx.reservation.guest.lastName}
                        </p>
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={tx.type === 'REFUND' ? 'destructive' : 'default'}>
                      {tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {methodIcons[tx.paymentMethod]}
                      <span>{tx.paymentMethod.replace('_', ' ')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={tx.type === 'REFUND' ? 'text-red-600' : 'text-green-600'}>
                      {tx.type === 'REFUND' ? '-' : '+'}${tx.amount.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`${statusColors[tx.paymentStatus]} text-white`}
                    >
                      {tx.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {tx.processedBy.firstName} {tx.processedBy.lastName}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredTransactions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">{t('common.noResults')}</h3>
              <p className="text-muted-foreground">
                No transactions found matching your criteria
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
