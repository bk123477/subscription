export const en = {
  // App
  'app.title': 'Subscape',

  // Navigation
  'nav.home': 'Home',
  'nav.schedule': 'Schedule',
  'nav.manage': 'Manage',

  // Home
  'home.monthlyTotal': 'This Month\'s Scheduled',

  'home.activeSubscriptions': 'active subscriptions',
  'home.todayLabel': 'Today',
  'home.dashboardView': 'Dashboard View',
  'home.view.landscape': 'Landscape',
  'home.view.timeWheel': 'Time Wheel',
  'home.view.minimal': 'Minimal',
  'home.view.subtitle.landscape': 'Category terrain overview',
  'home.view.subtitle.timeWheel': 'Payments by date',
  'home.view.subtitle.minimal': 'Clean totals and bars',
  'home.nextPayment': 'Next Payment',
  'home.noUpcomingPayments': 'No upcoming payments',
  'home.timeWheel.legend': 'Legend',

  // Categories
  'category.ai': 'AI',
  'category.entertain': 'Entertain',
  'category.membership': 'Member',
  'category.other': 'Other',

  // Manage
  'manage.addSubscription': 'Add Subscription',
  'manage.editSubscription': 'Edit Subscription',
  'manage.delete': 'Delete',
  'manage.deleteConfirm': 'Are you sure you want to delete this subscription?',
  'manage.search': 'Search subscriptions...',
  'manage.sortBy': 'Sort by',
  'manage.sortAmount': 'Amount',
  'manage.sortName': 'Name',
  'manage.sortNextPayment': 'Next Payment',
  'manage.sortCategory': 'Category',
  'manage.sortCurrency': 'Currency',
  'manage.sortStartDate': 'Start Date',
  'manage.endSubscription': 'End Subscription',
  'manage.reactivate': 'Reactivate',
  'manage.deletePermanent': 'Delete Permanently',
  'manage.endConfirm': 'End subscription? History will be kept.',
  'manage.permanentDeleteConfirm': 'Permanently delete? History will be lost.',
  'manage.ended': 'Ended',
  'manage.filterAll': 'All',
  'manage.amountRange': 'Amount Range',
  'manage.min': 'Min',
  'manage.max': 'Max',
  'manage.clearFilters': 'Clear Filters',

  // Form
  'form.name': 'Name',
  'form.namePlaceholder': 'Netflix, Spotify, etc.',
  'form.amount': 'Amount',
  'form.category': 'Category',
  'form.billingCycle': 'Billing Cycle',
  'form.monthly': 'Monthly',
  'form.yearly': 'Yearly',
  'form.billingDay': 'Billing Day',
  'form.billingMonth': 'Billing Month',
  'form.notes': 'Notes',
  'form.notesPlaceholder': 'Optional notes...',
  'form.save': 'Save',
  'form.cancel': 'Cancel',
  'form.required': 'This field is required',
  'form.currency': 'Currency',
  'form.freeTrialEnd': 'Free trial ends on',
  'form.freeTrial': 'Free Trial',
  'form.startedAt': 'Subscription Start Date',
  'form.startedAtHint': 'When did this subscription actually start? (Optional)',
  'form.serviceUrl': 'Service Website',
  'form.serviceUrlHint': 'Enter URL to show service logo (Optional)',

  // Schedule
  'schedule.upcomingPayments': 'Upcoming Payments',
  'schedule.listView': 'List',
  'schedule.calendarView': 'Calendar',
  'schedule.today': 'Today',
  'schedule.thisWeek': 'This Week',
  'schedule.thisMonth': 'This Month',
  'schedule.later': 'Later',
  'schedule.noEvents': 'No payments in this period',
  'calendar.selectMonth': 'Select Month',

  // Empty states
  'empty.noSubscriptions': 'No subscriptions yet',
  'empty.addFirst': 'Add your first subscription to get started',
  'empty.noResults': 'No subscriptions found',
  'empty.feature1': 'Track all your recurring payments',
  'empty.feature2': 'See upcoming billing dates',
  'empty.feature3': 'Get payment reminders',

  // Settings
  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.seedDemo': 'Load Demo Data',
  'settings.resetData': 'Reset All Data',
  'settings.resetConfirm': 'This will delete all your subscriptions. Are you sure?',
  'settings.english': 'English',
  'settings.korean': '한국어',

  // Months
  'month.1': 'Jan',
  'month.2': 'Feb',
  'month.3': 'Mar',
  'month.4': 'Apr',
  'month.5': 'May',
  'month.6': 'Jun',
  'month.7': 'Jul',
  'month.8': 'Aug',
  'month.9': 'Sep',
  'month.10': 'Oct',
  'month.11': 'Nov',
  'month.12': 'Dec',

  // Days of week
  'day.sun': 'S',
  'day.mon': 'M',
  'day.tue': 'T',
  'day.wed': 'W',
  'day.thu': 'T',
  'day.fri': 'F',
  'day.sat': 'S',

  // Common
  'common.perMonth': '/mo',
  'common.perYear': '/yr',
  'common.payments': 'payments',
  'common.confirm': 'Confirm',
  'common.close': 'Close',
  'common.items': 'items',

  // Row actions
  'row.delete': 'Delete',
  'row.pause': 'Pause',
  'common.total': 'Total',

  // Currency
  'currency.USD': 'USD',
  'currency.KRW': 'KRW',
  'currency.usd.symbol': '$',
  'currency.krw.symbol': '₩',

  // FX
  'fx.status': 'FX Rate',
  'fx.rate': '1 USD = {rate} KRW',
  'fx.updated': 'Updated {date}',
  'fx.source': 'Source: {source}',
  'fx.unavailable': 'FX unavailable',
  'fx.showingOriginal': 'Showing original currency',
  'fx.refresh': 'Refresh',
  'fx.refreshing': 'Refreshing...',
  'fx.cooldown': 'Wait {seconds}s',
  'fx.converted': 'Converted',
  'fx.original': 'Original: {amount}',
  // YTD
  'ytd.title': 'YTD Spend',
  'ytd.range': 'Jan 1 – Today',
  'ytd.total': 'Total YTD Paid',
  'ytd.byCategory': 'Spend by Category',
  'ytd.note': 'Calculated from scheduled billing dates',
  'ytd.summary': 'Summary',
  'ytd.monthly': 'Monthly',
  'ytd.monthlyBreakdown': 'Monthly Breakdown',
  'nav.ytd': 'YTD',
} as const;

export type TranslationKey = keyof typeof en;
