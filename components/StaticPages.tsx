import Link from "next/link";
import type { ReactNode } from "react";
import { PublicPageHeader } from "@/components/public-ui/PublicPageHeader";

const SITE_DOMAIN = "topdrawcompetitions.co.uk";
const SUPPORT_EMAIL = "hello@topdrawprizes.co.uk";

function LegalShell({
  title,
  eyebrow,
  children,
  wide,
}: {
  title: string;
  eyebrow?: string;
  path: string;
  noindex?: boolean;
  children: ReactNode;
  wide?: boolean;
  description?: string;
  seoTitle?: string;
}) {
  return (
    <div className={`container mx-auto py-10 ${wide ? "max-w-4xl" : "max-w-3xl"} td-text`}>
      {eyebrow && (
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-primary">{eyebrow}</div>
      )}
      <h1 className="text-3xl md:text-4xl font-black mt-1 mb-4">{title}</h1>
      <p className="text-xs td-soft mb-4">Last updated: [Insert date]</p>
      <div className="space-y-4 td-static-body leading-relaxed text-[15px]">{children}</div>
    </div>
  );
}

function H2({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="text-xl md:text-2xl font-bold td-text mt-10 pt-4 border-t td-border scroll-mt-24"
    >
      {children}
    </h2>
  );
}

function H3({ children }: { children: ReactNode }) {
  return <h3 className="text-base font-semibold td-text mt-5">{children}</h3>;
}

function P({ children }: { children: ReactNode }) {
  return <p className="td-static-body">{children}</p>;
}

function Clause({ n, children }: { n: string; children: ReactNode }) {
  return (
    <p className="td-static-body flex gap-3">
      <span className="font-mono-num text-primary font-bold shrink-0 min-w-[2.5rem]">{n}</span>
      <span>{children}</span>
    </p>
  );
}

function UL({ children }: { children: ReactNode }) {
  return <ul className="list-disc list-outside pl-6 space-y-1.5 td-static-body">{children}</ul>;
}

function Sub({ children }: { children: ReactNode }) {
  // sub-clauses like (a), (b)
  return <div className="pl-6 space-y-1.5 td-static-body">{children}</div>;
}

function SubItem({ k, children }: { k: string; children: ReactNode }) {
  return (
    <p className="flex gap-2">
      <span className="td-soft shrink-0">({k})</span>
      <span>{children}</span>
    </p>
  );
}

/* =========================
   Terms and Conditions
   ========================= */

const termsSections = [
  { id: "promoter", title: "1. The Promoter" },
  { id: "about", title: "2. About TopDraw Competitions" },
  { id: "eligibility", title: "3. Eligibility" },
  { id: "account", title: "4. Creating an Account" },
  { id: "how-to-enter", title: "5. How to Enter" },
  { id: "paid-entries", title: "6. Paid Online Entries" },
  { id: "free-postal", title: "7. Free Postal Entry Route" },
  { id: "tickets", title: "8. Ticket Allocation" },
  { id: "closing", title: "9. Competition Closing" },
  { id: "minimum-sales", title: "10. Unsold Tickets, Minimum Sales and Alternative Prize Rules" },
  { id: "draw", title: "11. Draw Process" },
  { id: "winner-notification", title: "12. Winner Notification" },
  { id: "verification", title: "13. Winner Verification" },
  { id: "prizes", title: "14. Prizes" },
  { id: "cash-alt", title: "15. Cash Alternatives" },
  { id: "delivery", title: "16. Prize Delivery" },
  { id: "instant-win", title: "17. Instant Win Prizes" },
  { id: "wallet", title: "18. Wallet Credit" },
  { id: "refunds", title: "19. Refunds and Cancellations" },
  { id: "chargebacks", title: "20. Chargebacks and Failed Payments" },
  { id: "responsible", title: "21. Responsible Entry" },
  { id: "publicity", title: "22. Winner Publicity" },
  { id: "data", title: "23. Data Protection" },
  { id: "platform", title: "24. Platform Availability and Technical Issues" },
  { id: "fraud", title: "25. Fraud, Abuse and Disqualification" },
  { id: "liability", title: "26. Limitation of Liability" },
  { id: "changes", title: "27. Changes to Competitions and Terms" },
  { id: "third-party", title: "28. Third-Party Platforms" },
  { id: "law", title: "29. Governing Law" },
  { id: "contact", title: "30. Contact" },
];

export function Terms() {
  return (
    <LegalShell
      title="Terms and Conditions"
      seoTitle="TopDraw Terms and Conditions | Prize Competitions"
      description="Read the TopDraw terms and conditions for prize competitions, tickets, free postal entry, winners, prize claims, payments and account use."
      eyebrow="Legal"
      path="/terms-and-conditions"
      wide
    >
      <p className="td-muted">
        Prepared for: Daniel Lyons trading as TopDraw. Website: {SITE_DOMAIN}. Email: {SUPPORT_EMAIL}.
      </p>
      <p className="td-muted">
        Promoter address: [Placeholder address to be replaced before launch].
      </p>

      <div className="grid lg:grid-cols-[220px_1fr] gap-8 mt-6">
        <aside className="hidden lg:block">
          <div className="sticky top-24 text-xs space-y-1.5">
            <div className="font-bold td-text uppercase tracking-wider mb-2">Contents</div>
            {termsSections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="block td-soft hover:text-[color:var(--td-text)]">
                {s.title}
              </a>
            ))}
          </div>
        </aside>

        <div className="space-y-3">
          <H2 id="promoter">1. The Promoter</H2>
          <Clause n="1.1">
            The promoter of the competitions is Daniel Lyons trading as TopDraw, of [insert full postal address]
            (“Promoter”, “we”, “us” and “our”).
          </Clause>
          <Clause n="1.2">
            TopDraw is a trading name used by the Promoter. TopDraw is not currently operated by a registered limited
            company.
          </Clause>
          <Clause n="1.3">
            The Promoter operates prize draw competitions through the website {SITE_DOMAIN} and any related official
            TopDraw digital channels used to promote, administer, record or publish competitions (“Platform”).
          </Clause>
          <Clause n="1.4">The Promoter can be contacted by email at {SUPPORT_EMAIL}.</Clause>
          <Clause n="1.5">
            These Terms and Conditions apply to all competitions operated by the Promoter on the Platform, unless a
            specific competition page states additional terms. If there is a conflict between these Terms and
            Conditions and a specific competition page, the specific competition page will apply only to that
            competition.
          </Clause>

          <H2 id="about">2. About TopDraw Competitions</H2>
          <Clause n="2.1">
            TopDraw operates prize draw competitions in which entrants can purchase paid entries or use a free postal
            entry route.
          </Clause>
          <Clause n="2.2">
            Each competition will have its own competition page showing the key details, which may include:
          </Clause>
          <Sub>
            <SubItem k="a">the prize or prizes available;</SubItem>
            <SubItem k="b">any cash alternative, where applicable;</SubItem>
            <SubItem k="c">the entry price;</SubItem>
            <SubItem k="d">the maximum number of entries available;</SubItem>
            <SubItem k="e">any maximum entry limit per person;</SubItem>
            <SubItem k="f">the opening date and closing date;</SubItem>
            <SubItem k="g">the draw date or expected draw date;</SubItem>
            <SubItem k="h">whether the prize is guaranteed or subject to a minimum sales condition;</SubItem>
            <SubItem k="i">whether instant win prizes are available;</SubItem>
            <SubItem k="j">any specific delivery, collection, verification or prize conditions.</SubItem>
          </Sub>
          <Clause n="2.3">
            TopDraw competitions are intended to operate as prize draws with a genuine free postal entry route. Paid
            entries and valid free postal entries have the same chance of winning per entry.
          </Clause>
          <Clause n="2.4">
            TopDraw is not a lottery, raffle, betting product, casino, gambling site or subscription service. We do
            not currently offer subscriptions or referral rewards.
          </Clause>
          <Clause n="2.5">
            TopDraw may offer instant win prizes in future competitions. Where instant win prizes are available, the
            competition page will state this clearly.
          </Clause>
          <Clause n="2.6">
            TopDraw may operate a customer wallet. Wallet credit is not cash, is not a bank account, does not earn
            interest, and may only be used on the Platform unless we expressly state otherwise.
          </Clause>

          <H2 id="eligibility">3. Eligibility</H2>
          <Clause n="3.1">Competitions are open to UK residents aged 18 or over only.</Clause>
          <Clause n="3.2">By entering a competition, you confirm that:</Clause>
          <Sub>
            <SubItem k="a">you are at least 18 years old;</SubItem>
            <SubItem k="b">you are resident in the United Kingdom;</SubItem>
            <SubItem k="c">you have the legal capacity to enter;</SubItem>
            <SubItem k="d">you have read and accepted these Terms and Conditions;</SubItem>
            <SubItem k="e">the information you provide is accurate, complete and up to date;</SubItem>
            <SubItem k="f">you are entering for yourself and not on behalf of another person.</SubItem>
          </Sub>
          <Clause n="3.3">
            Employees, contractors, agents or close family members of the Promoter, or anyone professionally connected
            with a competition, may not enter that competition unless we expressly permit this in writing.
          </Clause>
          <Clause n="3.4">
            We may refuse or cancel an entry, suspend an account, withhold a prize, or disqualify an entrant where we
            reasonably believe that:
          </Clause>
          <Sub>
            <SubItem k="a">the entrant is under 18;</SubItem>
            <SubItem k="b">the entrant is not resident in the United Kingdom;</SubItem>
            <SubItem k="c">the entrant has provided false, incomplete or misleading information;</SubItem>
            <SubItem k="d">the entrant has created multiple accounts to bypass entry limits;</SubItem>
            <SubItem k="e">the entrant has attempted to manipulate or abuse the Platform;</SubItem>
            <SubItem k="f">the entrant has breached these Terms and Conditions;</SubItem>
            <SubItem k="g">
              the entrant has acted fraudulently, abusively, unlawfully or contrary to the spirit of the competition.
            </SubItem>
          </Sub>

          <H2 id="account">4. Creating an Account</H2>
          <Clause n="4.1">To enter a competition online, you may be required to create an account on the Platform.</Clause>
          <Clause n="4.2">You must keep your account details secure and must not allow any other person to use your account.</Clause>
          <Clause n="4.3">
            You are responsible for ensuring that your account information, including your name, email address, phone
            number and postal address, is accurate and up to date.
          </Clause>
          <Clause n="4.4">
            We are not responsible if you miss winner notifications or prize communications because your details are
            inaccurate, outdated or incomplete.
          </Clause>
          <Clause n="4.5">
            We may suspend or close an account where we reasonably believe it is being misused, used by a person under
            18, used by multiple people, used for fraudulent activity, or used in breach of these Terms and Conditions.
          </Clause>

          <H2 id="how-to-enter">5. How to Enter</H2>
          <Clause n="5.1">There are two entry routes:</Clause>
          <Sub>
            <SubItem k="a">paid online entry through the Platform; and</SubItem>
            <SubItem k="b">free postal entry.</SubItem>
          </Sub>
          <Clause n="5.2">Both paid online entries and valid free postal entries have the same chance of winning per entry.</Clause>
          <Clause n="5.3">
            Entries are referred to on the Platform as “entries”, “tickets”, “ticket numbers” or similar wording. Each
            valid entry will be allocated one ticket number unless the competition page states otherwise.
          </Clause>
          <Clause n="5.4">
            The maximum number of entries per person for each competition will be stated on the relevant competition
            page. Unless stated otherwise, the same maximum entry limit applies to both paid online entries and free
            postal entries.
          </Clause>
          <Clause n="5.5">
            We do not recommend using unlimited paid entries. Each competition should state a clear maximum number of
            entries per person. This helps keep the competition fair, clear and transparent.
          </Clause>
          <Clause n="5.6">
            Entries must be received before the competition closes. Entries received after the closing date or after
            all available tickets have been allocated will not be entered.
          </Clause>
          <Clause n="5.7">No entry is confirmed until it has been accepted and recorded by the Promoter.</Clause>

          <H2 id="paid-entries">6. Paid Online Entries</H2>
          <Clause n="6.1">
            To enter online, you must select the competition you wish to enter, choose the number of entries you want,
            complete any required checkout process, and make payment through the available payment method.
          </Clause>
          <Clause n="6.2">
            Payments are currently expected to be processed through Stripe or another payment provider selected by the
            Promoter.
          </Clause>
          <Clause n="6.3">
            Once payment has been authorised and the entry has been accepted by the Platform, ticket numbers will be
            allocated randomly.
          </Clause>
          <Clause n="6.4">The entry price will be stated on the competition page and at checkout.</Clause>
          <Clause n="6.5">You are responsible for checking your order before completing payment.</Clause>
          <Clause n="6.6">
            Paid entries are final once confirmed, except where a refund is required under these Terms and Conditions
            or applicable law.
          </Clause>

          <H2 id="free-postal">7. Free Postal Entry Route</H2>
          <Clause n="7.1">Every paid competition will have a free postal entry route.</Clause>
          <Clause n="7.2">To enter for free by post, send a postcard or letter to:</Clause>
          <pre className="whitespace-pre-line td-surface-soft border td-border p-3 rounded td-static-body text-sm ml-12">
            {`TopDraw Free Entry\n[Insert postal address]`}
          </pre>
          <Clause n="7.3">Each free postal entry must include:</Clause>
          <Sub>
            <SubItem k="a">the name of the competition you wish to enter;</SubItem>
            <SubItem k="b">your full name;</SubItem>
            <SubItem k="c">your date of birth;</SubItem>
            <SubItem k="d">your email address;</SubItem>
            <SubItem k="e">your contact telephone number;</SubItem>
            <SubItem k="f">your full postal address;</SubItem>
            <SubItem k="g">
              a statement confirming that you are a UK resident aged 18 or over and that you agree to these Terms and
              Conditions.
            </SubItem>
          </Sub>
          <Clause n="7.4">Each postal entry must be sent separately. Bulk entries in the same envelope will not be accepted.</Clause>
          <Clause n="7.5">Postal entries must be sent by ordinary post. Hand-delivered entries will not be accepted.</Clause>
          <Clause n="7.6">
            Postal entries must be received before the competition closes. We are not responsible for postal delays,
            lost post, damaged post, incomplete entries or entries received after the closing date.
          </Clause>
          <Clause n="7.7">
            Valid postal entries will be processed and allocated ticket numbers randomly in the same way as paid online
            entries.
          </Clause>
          <Clause n="7.8">
            The same maximum entry limit stated on the competition page applies to postal entries. For example, if a
            competition allows a maximum of 25 entries per person, you may enter up to 25 times by paid entry, postal
            entry, or a combination of both.
          </Clause>
          <Clause n="7.9">
            A postal entry will be rejected if it is incomplete, illegible, sent in bulk, received late, does not
            identify the competition, does not include the required details, or appears to be fraudulent or automated.
          </Clause>
          <Clause n="7.10">
            No purchase is required to enter by post. You are responsible only for the normal cost of sending your
            postal entry.
          </Clause>

          <H2 id="tickets">8. Ticket Allocation</H2>
          <Clause n="8.1">
            Ticket numbers are allocated randomly by the Platform or by the Promoter’s competition administration
            system.
          </Clause>
          <Clause n="8.2">Ticket numbers have no cash value and cannot be transferred, sold or exchanged.</Clause>
          <Clause n="8.3">
            Where a technical issue affects ticket allocation, we may correct the allocation, void affected entries,
            reallocate ticket numbers, refund affected paid entries, or take another reasonable step to protect the
            fairness of the competition.
          </Clause>
          <Clause n="8.4">
            The official record of entries is the record held by the Promoter in the Platform or administration system.
          </Clause>

          <H2 id="closing">9. Competition Closing</H2>
          <Clause n="9.1">Each competition will close on the earlier of:</Clause>
          <Sub>
            <SubItem k="a">the closing date and time shown on the competition page; or</SubItem>
            <SubItem k="b">the point at which all available ticket numbers have been allocated.</SubItem>
          </Sub>
          <Clause n="9.2">
            We may extend a competition where the competition page states that extensions are possible, provided the
            extension is communicated clearly on the Platform.
          </Clause>
          <Clause n="9.3">
            We will not shorten a competition after it has launched unless required for technical, legal,
            fraud-prevention, payment-provider, platform-integrity, safety or operational reasons.
          </Clause>
          <Clause n="9.4">Where a competition is extended, all valid entries already received will remain valid.</Clause>

          <H2 id="minimum-sales">10. Unsold Tickets, Minimum Sales and Alternative Prize Rules</H2>
          <Clause n="10.1">
            Some competitions may be guaranteed prize competitions. If a competition is described as guaranteed, the
            advertised prize will be awarded regardless of the number of tickets sold, unless the competition is
            cancelled under these Terms and Conditions.
          </Clause>
          <Clause n="10.2">
            Some competitions may be subject to a minimum sales condition. If this applies, the competition page must
            state this clearly before entry.
          </Clause>
          <Clause n="10.3">
            Where a competition is subject to a minimum sales condition and the minimum is not reached, we may do one
            or more of the following, provided this was stated clearly on the competition page:
          </Clause>
          <Sub>
            <SubItem k="a">extend the competition;</SubItem>
            <SubItem k="b">award the cash alternative stated on the competition page;</SubItem>
            <SubItem k="c">award a prize value equal to a stated percentage of paid ticket revenue;</SubItem>
            <SubItem k="d">cancel the competition and refund paid entries.</SubItem>
          </Sub>
          <Clause n="10.4">
            If a “percentage of ticket sales” prize applies, the competition page must state the percentage clearly
            before entry. For example: “If the minimum sales threshold is not reached, the winner will receive 50% of
            paid ticket revenue instead of the advertised prize.”
          </Clause>
          <Clause n="10.5">
            We recommend using this rule carefully. If a competition advertises a specific headline prize, switching to
            50% of paid ticket revenue can cause complaints unless it is made very clear on the competition page and
            in promotional material.
          </Clause>
          <Clause n="10.6">
            The Promoter must not describe a prize as guaranteed if it is subject to a minimum sales condition,
            replacement prize, percentage-of-sales rule or cancellation condition.
          </Clause>

          <H2 id="draw">11. Draw Process</H2>
          <Clause n="11.1">Winners will be selected fairly and at random from all valid entries.</Clause>
          <Clause n="11.2">Draws may be conducted by:</Clause>
          <Sub>
            <SubItem k="a">an automated random draw system;</SubItem>
            <SubItem k="b">a manual recorded draw process; or</SubItem>
            <SubItem k="c">another verifiable random selection method.</SubItem>
          </Sub>
          <Clause n="11.3">The draw method may vary by competition and will be selected by the Promoter.</Clause>
          <Clause n="11.4">
            Draws may be recorded, live-streamed, posted or summarised on the Platform and/or TopDraw’s official social
            media channels, including the website, Instagram and Facebook.
          </Clause>
          <Clause n="11.5">The Promoter’s official entry records will determine which entries are included in a draw.</Clause>
          <Clause n="11.6">
            If there is a technical issue, data issue, platform error, human error or suspected manipulation affecting
            the draw, we may pause the draw, investigate, correct the issue, re-run the draw, or take another
            reasonable step to protect the fairness of the competition.
          </Clause>

          <H2 id="winner-notification">12. Winner Notification</H2>
          <Clause n="12.1">
            Winners will normally be contacted within 24 hours of the draw using the contact details provided on their
            account or entry.
          </Clause>
          <Clause n="12.2">Winners may be contacted by email, telephone, account notification or another reasonable method.</Clause>
          <Clause n="12.3">It is your responsibility to ensure your contact details are accurate and up to date.</Clause>
          <Clause n="12.4">A winner must respond and complete any required verification within 21 days of our first notification.</Clause>
          <Clause n="12.5">
            If a winner does not respond within 21 days, fails verification, is disqualified, refuses the prize, or
            cannot accept the prize for any reason, we may withdraw the prize and select another winner from the valid
            entries.
          </Clause>

          <H2 id="verification">13. Winner Verification</H2>
          <Clause n="13.1">Before awarding a prize, we may require the winner to provide proof of:</Clause>
          <Sub>
            <SubItem k="a">identity;</SubItem>
            <SubItem k="b">age;</SubItem>
            <SubItem k="c">address;</SubItem>
            <SubItem k="d">UK residency;</SubItem>
            <SubItem k="e">ownership of the payment method or account used;</SubItem>
            <SubItem k="f">ownership of the bank account used for any cash prize or cash alternative;</SubItem>
            <SubItem k="g">
              any other information reasonably required for fraud prevention, legal compliance, payment-provider
              requirements or prize fulfilment.
            </SubItem>
          </Sub>
          <Clause n="13.2">We may withhold a prize until verification is complete.</Clause>
          <Clause n="13.3">If a winner fails to provide satisfactory verification, we may disqualify the winner and select another winner.</Clause>
          <Clause n="13.4">
            Cash prizes and cash alternatives will only be paid to a verified bank account in the winner’s own name.
            We will not pay prize money to a third party.
          </Clause>

          <H2 id="prizes">14. Prizes</H2>
          <Clause n="14.1">The prize or prizes for each competition will be described on the relevant competition page.</Clause>
          <Clause n="14.2">Prizes may include physical goods, cash, gift cards, vouchers, services, experiences or a combination of these.</Clause>
          <Clause n="14.3">
            Images used on the Platform are for illustration and marketing purposes. The actual prize may vary slightly
            where the difference does not materially reduce the value or nature of the prize.
          </Clause>
          <Clause n="14.4">
            Where a prize is supplied by a third party, it may be subject to the supplier’s own terms, availability,
            warranties and restrictions.
          </Clause>
          <Clause n="14.5">Prizes are non-transferable unless we agree otherwise in writing.</Clause>
          <Clause n="14.6">
            We may substitute a prize with a reasonable equivalent where the original prize becomes unavailable for
            reasons outside our reasonable control.
          </Clause>
          <Clause n="14.7">
            We are not responsible for the prize once it has been delivered to, collected by, or transferred to the
            winner, except where required by law.
          </Clause>

          <H2 id="cash-alt">15. Cash Alternatives</H2>
          <Clause n="15.1">Cash alternatives may be offered on some physical prizes.</Clause>
          <Clause n="15.2">
            A cash alternative will only be available where it is stated on the competition page or offered by the
            Promoter after the draw.
          </Clause>
          <Clause n="15.3">Cash prizes do not have a separate cash alternative.</Clause>
          <Clause n="15.4">
            Where a winner chooses a cash alternative, the winner will receive the cash alternative amount stated on
            the competition page or confirmed by the Promoter.
          </Clause>
          <Clause n="15.5">Once a winner has accepted a cash alternative, they cannot later request the physical prize.</Clause>
          <Clause n="15.6">Cash alternatives will only be paid after verification is complete.</Clause>

          <H2 id="delivery">16. Prize Delivery</H2>
          <Clause n="16.1">UK delivery is included unless the competition page states otherwise.</Clause>
          <Clause n="16.2">
            We will aim to arrange prize delivery within a reasonable time after the winner has completed verification
            and accepted the prize.
          </Clause>
          <Clause n="16.3">
            Some prizes may require additional time due to supplier availability, delivery logistics, customisation,
            product release dates, bank processing times, or verification requirements.
          </Clause>
          <Clause n="16.4">Winners must cooperate with reasonable delivery arrangements.</Clause>
          <Clause n="16.5">
            If a winner fails to cooperate with delivery, refuses delivery, provides an incorrect address, or fails to
            collect a prize where required, we may store the prize for a reasonable period and may charge reasonable
            storage or re-delivery costs.
          </Clause>

          <H2 id="instant-win">17. Instant Win Prizes</H2>
          <Clause n="17.1">TopDraw may offer instant win prizes in future competitions.</Clause>
          <Clause n="17.2">Where instant win prizes are available, the competition page will state this clearly.</Clause>
          <Clause n="17.3">Instant win prize mechanics may vary by competition and will be explained on the competition page.</Clause>
          <Clause n="17.4">
            Unless stated otherwise, a valid paid or postal entry will have the same chance per entry of winning any
            available instant win prize.
          </Clause>
          <Clause n="17.5">
            If an instant win result is affected by technical error, display error, system malfunction, data issue,
            payment issue or suspected manipulation, we may void the affected result, correct the error, refund the
            affected paid entry, award a reasonable equivalent, or take another reasonable step to preserve fairness.
          </Clause>
          <Clause n="17.6">
            Instant win animations, graphics or on-screen effects are for entertainment and presentation only. The
            official result is the result recorded in the Promoter’s system.
          </Clause>

          <H2 id="wallet">18. Wallet Credit</H2>
          <Clause n="18.1">TopDraw may provide a wallet or credit balance feature on the Platform.</Clause>
          <Clause n="18.2">
            Wallet credit may be issued through deposits, refunds, goodwill credits, promotional credits, prize credits
            or other account adjustments.
          </Clause>
          <Clause n="18.3">
            Wallet credit is not cash, is not a bank account, does not earn interest, and cannot be transferred to
            another user.
          </Clause>
          <Clause n="18.4">Wallet credit can only be used on the Platform unless we expressly state otherwise.</Clause>
          <Clause n="18.5">
            Promotional wallet credit may expire or be subject to specific conditions. Any such conditions will be
            stated when the credit is issued.
          </Clause>
          <Clause n="18.6">
            We may reverse wallet credit that has been added in error, obtained fraudulently, generated through a
            chargeback, or issued in breach of these Terms and Conditions.
          </Clause>
          <Clause n="18.7">
            We may restrict withdrawals or use of wallet credit where we need to complete identity checks, fraud
            checks, payment checks, responsible play checks, or legal compliance checks.
          </Clause>

          <H2 id="refunds">19. Refunds and Cancellations</H2>
          <Clause n="19.1">Paid entries are final once confirmed and are generally non-refundable.</Clause>
          <Clause n="19.2">Refunds may be issued where:</Clause>
          <Sub>
            <SubItem k="a">a competition is cancelled;</SubItem>
            <SubItem k="b">a duplicate payment has been taken in error;</SubItem>
            <SubItem k="c">a technical issue has prevented valid entry;</SubItem>
            <SubItem k="d">we are required to refund by law;</SubItem>
            <SubItem k="e">we choose to refund at our discretion.</SubItem>
          </Sub>
          <Clause n="19.3">
            If a competition is cancelled, we may refund paid entries to the original payment method or issue wallet
            credit, unless the law requires a particular refund method.
          </Clause>
          <Clause n="19.4">We are not responsible for bank processing times, payment-provider delays or card issuer delays.</Clause>
          <Clause n="19.5">
            If you believe a payment has been taken incorrectly, you should contact us at {SUPPORT_EMAIL} before
            raising a chargeback.
          </Clause>

          <H2 id="chargebacks">20. Chargebacks and Failed Payments</H2>
          <Clause n="20.1">If you raise a chargeback or payment dispute, we may suspend your account while the matter is investigated.</Clause>
          <Clause n="20.2">
            If a chargeback relates to entries in a competition, those entries may be cancelled unless the payment
            dispute is resolved in your favour.
          </Clause>
          <Clause n="20.3">
            If you win a prize using entries connected to a failed payment, reversed payment, unauthorised payment or
            chargeback, we may withhold or withdraw the prize.
          </Clause>
          <Clause n="20.4">
            We may recover reasonable costs, losses and payment-provider charges caused by an unjustified chargeback,
            where permitted by law.
          </Clause>

          <H2 id="responsible">21. Responsible Entry</H2>
          <Clause n="21.1">TopDraw competitions are intended to be fun and affordable.</Clause>
          <Clause n="21.2">
            You should only spend what you can afford and should not enter competitions as a way to solve financial
            problems.
          </Clause>
          <Clause n="21.3">
            We may refuse entries, restrict accounts, apply entry limits, suspend accounts or close accounts where we
            believe entry behaviour is harmful, excessive, fraudulent, irresponsible or otherwise inappropriate.
          </Clause>
          <Clause n="21.4">
            If you feel you need support, you can contact us at {SUPPORT_EMAIL} and we can restrict or close your
            account.
          </Clause>
          <Clause n="21.5">You can also seek support from GamCare at www.gamcare.org.uk.</Clause>

          <H2 id="publicity">22. Winner Publicity</H2>
          <Clause n="22.1">
            By entering, you agree that if you win, we may publish limited winner information, including your first
            name, surname initial, town or county, prize won and competition entered.
          </Clause>
          <Clause n="22.2">
            We may ask winners to take part in photos, videos, interviews, social media content or other promotional
            activity.
          </Clause>
          <Clause n="22.3">Winners are not required to provide photos or videos unless they choose to do so.</Clause>
          <Clause n="22.4">
            If you object to your winner information being published, you should contact us. We will consider the
            request, but we may still need to publish or retain certain information where required to demonstrate that
            the competition was run fairly.
          </Clause>

          <H2 id="data">23. Data Protection</H2>
          <Clause n="23.1">We will process personal data in accordance with our Privacy Policy.</Clause>
          <Clause n="23.2">We may use your personal data to:</Clause>
          <Sub>
            <SubItem k="a">create and manage your account;</SubItem>
            <SubItem k="b">process entries and payments;</SubItem>
            <SubItem k="c">allocate tickets;</SubItem>
            <SubItem k="d">administer competitions;</SubItem>
            <SubItem k="e">contact winners;</SubItem>
            <SubItem k="f">verify age, identity, address and eligibility;</SubItem>
            <SubItem k="g">deliver prizes;</SubItem>
            <SubItem k="h">prevent fraud, abuse, underage entry and unlawful activity;</SubItem>
            <SubItem k="i">comply with legal, tax, accounting, payment-provider and regulatory obligations;</SubItem>
            <SubItem k="j">send marketing communications where you have consented or where we are otherwise permitted by law.</SubItem>
          </Sub>
          <Clause n="23.3">
            We may share personal data with payment providers, delivery companies, suppliers, verification providers,
            professional advisers, technology providers, fraud-prevention services, regulators or authorities where
            reasonably necessary.
          </Clause>
          <Clause n="23.4">More details are set out in our <Link href="/privacy-policy" className="underline td-text">Privacy Policy</Link>.</Clause>

          <H2 id="platform">24. Platform Availability and Technical Issues</H2>
          <Clause n="24.1">
            We will use reasonable care to keep the Platform available and functioning properly, but we do not
            guarantee that it will always be available, uninterrupted, error-free or compatible with every device or
            browser.
          </Clause>
          <Clause n="24.2">We are not responsible for:</Clause>
          <Sub>
            <SubItem k="a">internet failures;</SubItem>
            <SubItem k="b">device issues;</SubItem>
            <SubItem k="c">payment-provider outages;</SubItem>
            <SubItem k="d">social media platform outages;</SubItem>
            <SubItem k="e">email delivery failures;</SubItem>
            <SubItem k="f">postal delays;</SubItem>
            <SubItem k="g">third-party supplier issues;</SubItem>
            <SubItem k="h">unauthorised account access caused by your failure to keep your details secure;</SubItem>
            <SubItem k="i">technical issues outside our reasonable control.</SubItem>
          </Sub>
          <Clause n="24.3">
            If a technical error affects entries, ticket allocation, instant win results, draw results or prize
            fulfilment, we may take reasonable steps to correct the issue and preserve fairness.
          </Clause>

          <H2 id="fraud">25. Fraud, Abuse and Disqualification</H2>
          <Clause n="25.1">
            We may disqualify an entrant, withhold a prize, cancel entries, restrict an account, close an account or
            refuse future entry where we reasonably believe that the entrant has:
          </Clause>
          <Sub>
            <SubItem k="a">breached these Terms and Conditions;</SubItem>
            <SubItem k="b">provided false or misleading information;</SubItem>
            <SubItem k="c">entered while under 18;</SubItem>
            <SubItem k="d">entered from outside the United Kingdom;</SubItem>
            <SubItem k="e">created or used multiple accounts;</SubItem>
            <SubItem k="f">used automated systems, bots, scripts or abuse methods;</SubItem>
            <SubItem k="g">attempted to manipulate the Platform, ticket allocation, instant win mechanics or draw process;</SubItem>
            <SubItem k="h">used unauthorised, stolen or fraudulent payment methods;</SubItem>
            <SubItem k="i">acted abusively towards TopDraw, other entrants or winners;</SubItem>
            <SubItem k="j">made defamatory, threatening, discriminatory or harmful comments about TopDraw, its entrants or winners;</SubItem>
            <SubItem k="k">otherwise acted unlawfully or contrary to the spirit of the competition.</SubItem>
          </Sub>

          <H2 id="liability">26. Limitation of Liability</H2>
          <Clause n="26.1">
            Nothing in these Terms and Conditions excludes or limits liability for death or personal injury caused by
            negligence, fraud, fraudulent misrepresentation, or any liability that cannot legally be excluded.
          </Clause>
          <Clause n="26.2">
            Subject to clause 26.1, the Promoter will not be liable for indirect, consequential, special or economic
            losses arising out of or in connection with a competition, the Platform or a prize.
          </Clause>
          <Clause n="26.3">Subject to clause 26.1, the Promoter’s maximum liability to a winner is limited to the value of the prize won.</Clause>
          <Clause n="26.4">
            Subject to clause 26.1, the Promoter’s maximum liability to a non-winning entrant is limited to the amount
            paid by that entrant to enter the relevant competition.
          </Clause>
          <Clause n="26.5">Nothing in these Terms and Conditions affects your statutory rights.</Clause>

          <H2 id="changes">27. Changes to Competitions and Terms</H2>
          <Clause n="27.1">We may update these Terms and Conditions from time to time.</Clause>
          <Clause n="27.2">
            The version in force at the time you enter a competition will apply to that entry, unless a change is
            required by law, payment-provider rules, platform security, fraud prevention or another urgent operational
            reason.
          </Clause>
          <Clause n="27.3">
            We may update, suspend or withdraw any feature of the Platform, including wallet features, account
            features, instant win mechanics or promotional features.
          </Clause>

          <H2 id="third-party">28. Third-Party Platforms</H2>
          <Clause n="28.1">Competitions may be promoted on Instagram, Facebook, TikTok, YouTube or other social media platforms.</Clause>
          <Clause n="28.2">
            Unless stated otherwise, competitions are not sponsored, endorsed, administered by or associated with
            Instagram, Facebook, TikTok, YouTube, Apple, Google or any other third-party platform.
          </Clause>
          <Clause n="28.3">
            You agree to release those third-party platforms from any liability connected with TopDraw competitions, to
            the extent permitted by law.
          </Clause>

          <H2 id="law">29. Governing Law</H2>
          <Clause n="29.1">These Terms and Conditions are governed by the laws of England and Wales.</Clause>
          <Clause n="29.2">
            The courts of England and Wales will have exclusive jurisdiction, except where consumer law gives you the
            right to bring proceedings elsewhere in the United Kingdom.
          </Clause>

          <H2 id="contact">30. Contact</H2>
          <P>For questions about these Terms and Conditions, please contact:</P>
          <div className="rounded-xl border td-border td-surface-soft p-4 text-sm space-y-1 td-static-body">
            <div>Daniel Lyons trading as TopDraw</div>
            <div>Email: {SUPPORT_EMAIL}</div>
            <div>Website: {SITE_DOMAIN}</div>
            <div>Postal address: [insert full postal address]</div>
          </div>
        </div>
      </div>
    </LegalShell>
  );
}

/* =========================
   Free Entry Method
   ========================= */

export function FreeEntry() {
  return (
    <div className="container mx-auto py-8 td-text">
      
      <PublicPageHeader
        eyebrow="Free Postal Entry"
        title="Free Postal Entry"
        description="Every paid TopDraw competition includes a free postal entry route. Follow the instructions carefully so your entry can be processed and added to the correct draw."
      />
      <div className="space-y-4 td-static-body leading-relaxed text-[15px]">
      <H2>Free Postal Entry Route</H2>
      <P>You can enter TopDraw paid competitions for free by post.</P>
      <P>
        No purchase is required to enter by post. Postal entries have the same chance of winning per valid entry as
        paid online entries.
      </P>

      <H2>How to Enter for Free</H2>
      <P>Send a postcard or letter to:</P>
      <pre className="whitespace-pre-line td-surface-soft border td-border p-3 rounded td-static-body text-sm">
        {`TopDraw Free Entry\n[Insert postal address]`}
      </pre>
      <P>Your postal entry must include:</P>
      <UL>
        <li>the name of the competition you wish to enter;</li>
        <li>your full name;</li>
        <li>your date of birth;</li>
        <li>your email address;</li>
        <li>your phone number;</li>
        <li>your full postal address;</li>
        <li>
          a statement confirming that you are a UK resident aged 18 or over and that you agree to the TopDraw{" "}
          <Link href="/terms-and-conditions" className="underline td-text">Terms and Conditions</Link>.
        </li>
      </UL>

      <H2>Postal Entry Rules</H2>
      <UL>
        <li>Each postal entry must be sent separately.</li>
        <li>Bulk entries in the same envelope will not be accepted.</li>
        <li>Hand-delivered entries will not be accepted.</li>
        <li>Postal entries must be received before the competition closes.</li>
        <li>
          Postal entries received after a competition has closed, after all ticket numbers have been allocated, or
          after the relevant closing date will not be entered.
        </li>
        <li>You are responsible for the normal cost of sending your postal entry.</li>
      </UL>

      <H2>Entry Limits</H2>
      <P>The maximum number of entries per person for each competition is shown on the relevant competition page.</P>
      <P>The same maximum entry limit applies to paid entries and postal entries.</P>
      <P>
        For example, if a competition allows 25 entries per person, you may enter up to 25 times using paid entries,
        postal entries, or a combination of both.
      </P>

      <H2>Ticket Allocation</H2>
      <P>Valid postal entries will be processed by TopDraw and allocated ticket numbers randomly.</P>
      <P>Postal entries have the same chance of winning per entry as paid online entries.</P>
      </div>
    </div>
  );
}

/* =========================
   Responsible Play
   ========================= */

export function ResponsiblePlay() {
  return (
    <LegalShell
      title="Responsible Play"
      seoTitle="Responsible Play | TopDraw UK Competitions"
      description="Read TopDraw’s responsible play guidance, including 18+ UK-only participation, sensible spending, account safety and support resources."
      eyebrow="Player info"
      path="/responsible-play"
    >
      <H2>Play Responsibly</H2>
      <P>TopDraw competitions are intended to be fun, exciting and affordable.</P>
      <P>
        You should only enter competitions with money you can afford to spend. You should not enter competitions as a
        way to solve financial problems or recover losses.
      </P>

      <H2>18+ Only</H2>
      <P>TopDraw is strictly for UK residents aged 18 or over.</P>
      <P>We may ask for proof of age, identity and address before awarding any prize.</P>

      <H2>Account Restrictions</H2>
      <P>If you feel you are spending too much, or you want your account restricted or closed, contact us at:</P>
      <p className="td-text font-semibold">{SUPPORT_EMAIL}</p>
      <P>
        We may also restrict or close accounts where we believe entry behaviour is harmful, excessive, fraudulent,
        irresponsible or otherwise inappropriate.
      </P>

      <H2>Support</H2>
      <P>If you need support, you can contact GamCare:</P>
      <p>
        <a
          href="https://www.gamcare.org.uk"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          www.gamcare.org.uk
        </a>
      </p>
      <P>GamCare provides free information, advice and support for anyone affected by gambling-related harm.</P>
      <P>Although TopDraw is not a gambling site, we believe responsible participation matters.</P>
    </LegalShell>
  );
}

/* =========================
   Privacy Policy
   ========================= */

export function Privacy() {
  return (
    <LegalShell
      title="Privacy Policy"
      seoTitle="TopDraw Privacy Policy"
      description="Read how TopDraw handles personal data, account information, order details, competition entries, communications and user privacy."
      eyebrow="Legal"
      path="/privacy-policy"
    >
      <H2>1. Who We Are</H2>
      <P>This Privacy Policy explains how Daniel Lyons trading as TopDraw collects, uses and protects your personal data.</P>
      <div className="rounded-xl border td-border td-surface-soft p-4 text-sm space-y-1 td-static-body">
        <div>Website: {SITE_DOMAIN}</div>
        <div>Email: {SUPPORT_EMAIL}</div>
        <div>Postal address: [insert postal address]</div>
      </div>
      <P>For the purposes of UK data protection law, the Promoter is the controller of your personal data.</P>

      <H2>2. Personal Data We Collect</H2>
      <P>We may collect:</P>
      <Sub>
        <SubItem k="a">your name;</SubItem>
        <SubItem k="b">your date of birth;</SubItem>
        <SubItem k="c">your email address;</SubItem>
        <SubItem k="d">your phone number;</SubItem>
        <SubItem k="e">your postal address;</SubItem>
        <SubItem k="f">account login information;</SubItem>
        <SubItem k="g">payment and transaction information;</SubItem>
        <SubItem k="h">competition entries and ticket numbers;</SubItem>
        <SubItem k="i">wallet activity;</SubItem>
        <SubItem k="j">identity and age verification information;</SubItem>
        <SubItem k="k">winner information;</SubItem>
        <SubItem k="l">communications with us;</SubItem>
        <SubItem k="m">device, browser, IP address and website usage data;</SubItem>
        <SubItem k="n">marketing preferences.</SubItem>
      </Sub>
      <P>We do not store full card details. Card payments are processed by Stripe or another payment provider.</P>

      <H2>3. How We Use Your Data</H2>
      <P>We use your data to:</P>
      <Sub>
        <SubItem k="a">create and manage your account;</SubItem>
        <SubItem k="b">process entries and payments;</SubItem>
        <SubItem k="c">allocate tickets;</SubItem>
        <SubItem k="d">administer competitions;</SubItem>
        <SubItem k="e">run draws;</SubItem>
        <SubItem k="f">contact winners;</SubItem>
        <SubItem k="g">verify identity, age, address and eligibility;</SubItem>
        <SubItem k="h">deliver prizes;</SubItem>
        <SubItem k="i">operate wallet features;</SubItem>
        <SubItem k="j">prevent fraud, abuse, chargebacks, underage entry and unlawful activity;</SubItem>
        <SubItem k="k">respond to enquiries;</SubItem>
        <SubItem k="l">send service emails;</SubItem>
        <SubItem k="m">send marketing emails where permitted;</SubItem>
        <SubItem k="n">improve the Platform;</SubItem>
        <SubItem k="o">comply with legal, tax, accounting and payment-provider obligations.</SubItem>
      </Sub>

      <H2>4. Legal Bases</H2>
      <P>We process personal data using one or more of the following legal bases:</P>
      <Sub>
        <SubItem k="a">contract, where processing is needed to provide your account, entries, wallet, draws and prizes;</SubItem>
        <SubItem k="b">legal obligation, where processing is needed for tax, accounting, consumer law, fraud prevention or legal compliance;</SubItem>
        <SubItem k="c">legitimate interests, where processing is needed to operate, secure, improve and protect the Platform and competitions;</SubItem>
        <SubItem k="d">consent, where you opt in to marketing or optional promotional activity.</SubItem>
      </Sub>

      <H2>5. Sharing Your Data</H2>
      <P>We may share personal data with:</P>
      <Sub>
        <SubItem k="a">payment providers such as Stripe;</SubItem>
        <SubItem k="b">delivery companies;</SubItem>
        <SubItem k="c">prize suppliers;</SubItem>
        <SubItem k="d">identity or age verification providers;</SubItem>
        <SubItem k="e">website, hosting, analytics and technology providers;</SubItem>
        <SubItem k="f">email and marketing providers;</SubItem>
        <SubItem k="g">fraud-prevention providers;</SubItem>
        <SubItem k="h">professional advisers;</SubItem>
        <SubItem k="i">regulators, law enforcement, courts or public authorities where required.</SubItem>
      </Sub>

      <H2>6. Winner Information</H2>
      <P>
        If you win, we may publish limited winner information, such as your first name, surname initial, town or
        county, prize won and competition entered.
      </P>
      <P>
        We may ask you to take part in photographs, videos or interviews, but you are not required to provide photos
        or videos unless you choose to do so.
      </P>

      <H2>7. Marketing</H2>
      <P>We may send marketing emails where you have opted in or where we are otherwise permitted by law.</P>
      <P>You can unsubscribe at any time by using the unsubscribe link in our emails or contacting {SUPPORT_EMAIL}.</P>

      <H2>8. Cookies and Analytics</H2>
      <P>
        We use cookies and similar technologies as explained in our{" "}
        <Link href="/cookie-policy" className="underline td-text">Cookie Policy</Link>.
      </P>

      <H2>9. Data Retention</H2>
      <P>We keep personal data only for as long as reasonably necessary for the purposes set out in this Privacy Policy.</P>
      <P>
        We may keep certain records for longer where required for legal, tax, accounting, fraud prevention, payment
        dispute, winner verification or regulatory reasons.
      </P>

      <H2>10. Your Rights</H2>
      <P>Under UK data protection law, you may have rights to:</P>
      <Sub>
        <SubItem k="a">access your personal data;</SubItem>
        <SubItem k="b">correct inaccurate personal data;</SubItem>
        <SubItem k="c">request deletion of your personal data;</SubItem>
        <SubItem k="d">restrict processing;</SubItem>
        <SubItem k="e">object to processing;</SubItem>
        <SubItem k="f">request data portability;</SubItem>
        <SubItem k="g">withdraw consent where processing is based on consent;</SubItem>
        <SubItem k="h">complain to the Information Commissioner’s Office.</SubItem>
      </Sub>
      <P>To exercise your rights, contact {SUPPORT_EMAIL}.</P>

      <H2>11. Security</H2>
      <P>
        We use reasonable technical and organisational measures to protect personal data. However, no website or
        online system can be guaranteed to be completely secure.
      </P>

      <H2>12. Changes to This Policy</H2>
      <P>We may update this Privacy Policy from time to time. The latest version will be posted on the Platform.</P>
    </LegalShell>
  );
}

/* =========================
   Cookie Policy
   ========================= */

export function Cookies() {
  return (
    <LegalShell
      title="Cookie Policy"
      seoTitle="TopDraw Cookie Policy"
      description="Read how TopDraw uses cookies and similar technologies to run the website, improve performance, support analytics and manage user preferences."
      eyebrow="Legal"
      path="/cookie-policy"
    >
      <H2>1. What Are Cookies?</H2>
      <P>
        Cookies are small text files placed on your device when you visit a website. They help websites work properly,
        remember preferences, improve performance and understand how visitors use the site.
      </P>

      <H2>2. How We Use Cookies</H2>
      <P>TopDraw may use cookies and similar technologies to:</P>
      <Sub>
        <SubItem k="a">keep the website functioning;</SubItem>
        <SubItem k="b">keep you logged in;</SubItem>
        <SubItem k="c">remember preferences;</SubItem>
        <SubItem k="d">process entries and checkout activity;</SubItem>
        <SubItem k="e">support security and fraud prevention;</SubItem>
        <SubItem k="f">analyse website performance;</SubItem>
        <SubItem k="g">improve user experience;</SubItem>
        <SubItem k="h">support marketing and advertising where permitted.</SubItem>
      </Sub>

      <H2>3. Types of Cookies We May Use</H2>
      <H3>Strictly Necessary Cookies</H3>
      <P>These are required for the website to function, including login, checkout, security, account and competition-entry features.</P>
      <H3>Performance and Analytics Cookies</H3>
      <P>These help us understand how visitors use the Platform so we can improve it.</P>
      <H3>Functionality Cookies</H3>
      <P>These remember choices you make, such as preferences or account-related settings.</P>
      <H3>Marketing Cookies</H3>
      <P>These may be used to measure advertising performance and show relevant advertising, where permitted.</P>

      <H2>4. Third-Party Cookies</H2>
      <P>
        Some cookies may be set by third-party providers, such as payment providers, analytics providers, advertising
        platforms or embedded social media services.
      </P>

      <H2>5. Managing Cookies</H2>
      <P>You can control cookies through your browser settings. If you block some cookies, parts of the Platform may not work properly.</P>

      <H2>6. Updates</H2>
      <P>We may update this Cookie Policy from time to time. The latest version will be posted on the Platform.</P>
    </LegalShell>
  );
}

/* FAQs and HowItWorks moved to /faqs (src/pages/public/FAQs.tsx). */

/* =========================
   Contact (kept)
   ========================= */

export function Contact() {
  return (
    <div className="container mx-auto py-10 max-w-3xl td-text">
      
      <h1 className="text-3xl md:text-4xl font-black mt-1">Contact</h1>
      <p className="mt-4 td-static-body">For support, get in touch using the details below.</p>
      <div className="rounded-xl border td-border td-surface-soft p-4 text-sm space-y-2 mt-4">
        <div><span className="font-bold td-text">Email:</span> {SUPPORT_EMAIL}</div>
        <div><span className="font-bold td-text">Website:</span> {SITE_DOMAIN}</div>
        <div><span className="font-bold td-text">Promoter:</span> Daniel Lyons trading as TopDraw</div>
        <div><span className="font-bold td-text">Postal address:</span> [Placeholder address to be replaced before launch]</div>
        <div className="pt-2 border-t td-border text-xs td-soft">
          TopDraw is a trading name. TopDraw is not currently operated by a registered limited company.
        </div>
      </div>
    </div>
  );
}
