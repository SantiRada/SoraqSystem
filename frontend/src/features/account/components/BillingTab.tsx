import { useState } from 'react';
import { ArrowLeftRight, CalendarClock, Check, RefreshCw } from 'lucide-react';
import { Alert, Badge, Button, LoadingState, type BadgeTone } from '@/design-system';
import { useI18n, type MessageKey } from '@/i18n';
import { toUserMessage } from '@/shared/api/ApiError';
import { useApiQuery } from '@/shared/api/useApiQuery';
import { formatDate, formatMoney } from '@/shared/i18n/format';
import { cn } from '@/shared/lib/cn';
import { accountApi } from '../api/accountApi';
import type { Plan } from '../model/types';

const PLAN_KEYS: Record<string, MessageKey> = {
  standard: 'account.billing.plans.standard',
  annual: 'account.billing.plans.annual',
  education: 'account.billing.plans.education',
};
const SUBSCRIPTION_STATUS: Record<string, { key: MessageKey; tone: BadgeTone }> = {
  active: { key: 'account.billing.subscriptionStatus.active', tone: 'success' },
  trialing: { key: 'account.billing.subscriptionStatus.trialing', tone: 'accent' },
  past_due: { key: 'account.billing.subscriptionStatus.past_due', tone: 'warning' },
  canceled: { key: 'account.billing.subscriptionStatus.canceled', tone: 'neutral' },
};
const PAYMENT_STATUS: Record<string, { key: MessageKey; tone: BadgeTone }> = {
  paid: { key: 'account.billing.paymentStatus.paid', tone: 'success' },
  pending: { key: 'account.billing.paymentStatus.pending', tone: 'warning' },
  failed: { key: 'account.billing.paymentStatus.failed', tone: 'danger' },
  refunded: { key: 'account.billing.paymentStatus.refunded', tone: 'neutral' },
};

/**
 * Pagos tab: active plan, next payment, change plan, payment history.
 * Read-only until a payment provider exists: plan change is shown but checkout is disabled
 * and explained (honest availability — docs/PRODUCT.md §10).
 */
export function BillingTab() {
  const { t } = useI18n();
  const billing = useApiQuery((signal) => accountApi.billingOverview(signal), []);
  const [showPlans, setShowPlans] = useState(false);

  const planName = (code: string | null) => t(code && PLAN_KEYS[code] ? PLAN_KEYS[code] : 'account.billing.plans.unknown');
  const perInterval = (interval: string) => t(interval === 'year' ? 'account.billing.perInterval.year' : 'account.billing.perInterval.month');

  if (billing.status === 'loading') return <LoadingState label={t('account.billing.loading')} />;

  if (billing.status === 'error') {
    return (
      <Alert
        tone="danger"
        title={t('account.billing.errorTitle')}
        action={
          <Button variant="secondary" size="sm" leadingIcon={<RefreshCw />} onPress={billing.reload}>
            {t('common.actions.tryAgain')}
          </Button>
        }
      >
        {toUserMessage(billing.error, t)}
      </Alert>
    );
  }

  const { subscription, payments, plans, checkoutAvailable } = billing.data;
  const status = subscription ? SUBSCRIPTION_STATUS[subscription.status] : undefined;

  return (
    <div className="grid gap-8">
      {/* Active plan + next payment */}
      <div className="grid gap-4 sm:grid-cols-2">
        <section aria-labelledby="billing-plan-title" className="rounded-2xl border border-border p-5">
          <h3 id="billing-plan-title" className="text-xs text-muted">
            {t('account.billing.currentPlanTitle')}
          </h3>
          {subscription ? (
            <>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-xl font-semibold">
                {planName(subscription.plan.code)}
                <Badge tone={status?.tone ?? 'neutral'}>{t(status?.key ?? 'account.billing.subscriptionStatus.unknown')}</Badge>
              </p>
              <p className="mt-1 text-sm text-muted">
                {formatMoney(subscription.plan.amountMinor, subscription.plan.currency)}
                {perInterval(subscription.plan.interval)}
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-lg font-semibold">{t('account.billing.noPlan')}</p>
              <p className="mt-1 text-sm text-muted">{t('account.billing.noPlanDescription')}</p>
            </>
          )}
        </section>

        <section aria-labelledby="billing-next-title" className="rounded-2xl border border-border p-5">
          <h3 id="billing-next-title" className="flex items-center gap-2 text-xs text-muted">
            <CalendarClock aria-hidden="true" className="size-4" />
            {t('account.billing.nextPaymentTitle')}
          </h3>
          <p className="mt-2 text-base font-medium">
            {subscription?.nextPaymentAt && subscription.nextPaymentAmountMinor !== null
              ? t('account.billing.nextPayment', {
                  amount: formatMoney(subscription.nextPaymentAmountMinor, subscription.plan.currency),
                  date: formatDate(subscription.nextPaymentAt),
                })
              : subscription?.cancelAtPeriodEnd
                ? t('account.billing.cancelsOn', { date: formatDate(subscription.currentPeriodEnd) })
                : t('account.billing.noNextPayment')}
          </p>
        </section>
      </div>

      {/* Change plan */}
      <section aria-labelledby="billing-plans-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="billing-plans-title" className="text-base font-semibold">
            {t('account.billing.plansTitle')}
          </h3>
          <Button variant="secondary" size="sm" leadingIcon={<ArrowLeftRight />} onPress={() => setShowPlans((v) => !v)}>
            {showPlans ? t('account.billing.hidePlans') : subscription ? t('account.billing.changePlan') : t('account.billing.choosePlan')}
          </Button>
        </div>

        {showPlans && (
          <div className="mt-4 grid gap-4">
            <ul aria-label={t('account.billing.plansLabel')} className="grid list-none gap-3 p-0 sm:grid-cols-3">
              {plans.map((plan) => (
                <PlanCard key={plan.code} plan={plan} isCurrent={subscription?.plan.code === plan.code} planName={planName(plan.code)} perInterval={perInterval(plan.interval)} />
              ))}
            </ul>
            {!checkoutAvailable && (
              <Alert tone="info" title={t('account.billing.checkoutUnavailableTitle')}>
                {t('account.billing.checkoutUnavailable')}
              </Alert>
            )}
            <div>
              <Button isDisabled={!checkoutAvailable}>{t('account.billing.continueToPayment')}</Button>
            </div>
          </div>
        )}
      </section>

      {/* History */}
      <section aria-labelledby="billing-history-title">
        <h3 id="billing-history-title" className="text-base font-semibold">
          {t('account.billing.historyTitle')}
        </h3>
        {payments.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-border p-5 text-sm text-muted">{t('account.billing.historyEmpty')}</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <caption className="sr-only">{t('account.billing.historyTitle')}</caption>
              <thead className="bg-surface-secondary text-xs text-muted">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">{t('account.billing.columns.date')}</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">{t('account.billing.columns.plan')}</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">{t('account.billing.columns.amount')}</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">{t('account.billing.columns.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator">
                {payments.map((payment) => {
                  const paymentStatus = PAYMENT_STATUS[payment.status];
                  const date = payment.paidAt ?? payment.createdAt;
                  return (
                    <tr key={payment.id}>
                      <td className="px-4 py-3">
                        <time dateTime={date}>{formatDate(date)}</time>
                      </td>
                      <td className="px-4 py-3">{planName(payment.planCode)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatMoney(payment.amountMinor, payment.currency)}</td>
                      <td className="px-4 py-3">
                        <Badge tone={paymentStatus?.tone ?? 'neutral'}>{t(paymentStatus?.key ?? 'account.billing.paymentStatus.unknown')}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function PlanCard({ plan, isCurrent, planName, perInterval }: { plan: Plan; isCurrent: boolean; planName: string; perInterval: string }) {
  const { t } = useI18n();

  return (
    <li className={cn('flex flex-col gap-2 rounded-2xl border p-4', isCurrent ? 'border-accent bg-accent-soft' : 'border-border')}>
      <p className="flex items-center justify-between gap-2 font-semibold">
        {planName}
        {isCurrent && (
          <Badge tone="accent">
            <Check aria-hidden="true" className="size-3" />
            {t('account.billing.currentBadge')}
          </Badge>
        )}
      </p>
      <p className="text-lg font-semibold tabular-nums">
        {formatMoney(plan.amountMinor, plan.currency)}
        <span className="text-sm font-normal text-muted">{perInterval}</span>
      </p>
      {plan.interval === 'year' && (
        <p className="text-xs text-muted">{t('account.billing.annualEquivalent', { amount: formatMoney(Math.round(plan.amountMinor / 12), plan.currency) })}</p>
      )}
      {plan.requiresCode && <p className="text-xs text-muted">{t('account.billing.requiresCode')}</p>}
    </li>
  );
}
