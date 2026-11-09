import Link from 'next/link'
import { Search, Plus, ShieldCheck, Bell, CheckCircle2, AlertTriangle, ArrowRight, HelpCircle, Lock, Award, Clock } from 'lucide-react'

export const metadata = {
  title: 'How It Works',
  description: 'Learn how CampusFind connects students and staff to recover lost belongings safely at Amal Jyothi.',
}

export default function HowItWorksPage() {
  return (
    <div className="space-y-12 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-10">
        <div className="container-page max-w-4xl text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Official Security Protocol</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How CampusFind Works
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            A secure, verified, and university-administered system to report, search, and reclaim lost items across campus.
          </p>
        </div>
      </div>

      <div className="container-page max-w-4xl space-y-10">
        {/* Step-by-Step Walkthrough */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center font-bold text-lg mb-4">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Report in 60 Seconds</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Whether you misplaced your calculator or found keys in the lab, submit a quick report with photos, location, and confidential verification marks.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center font-bold text-lg mb-4">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Real-Time Sync</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Reports sync live across the campus feed. When a potential match is reported, campus members receive immediate notifications.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center font-bold text-lg mb-4">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Secure Verification</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Claimants submit proof of ownership. Campus security or department staff verify details before authorizing collection.
            </p>
          </div>
        </div>

        {/* Security & Privacy Standards */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Privacy & Anti-Theft Safeguards</h2>
              <p className="text-xs text-slate-500">How we protect valuable belongings from fraudulent claims</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-semibold mb-0.5">Hidden Serial Numbers</strong>
                Private identifying details and serial numbers are never displayed publicly.
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
              <Award className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-semibold mb-0.5">College Account Validation</strong>
                Only authenticated campus students and staff can post reports and submit claims.
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-semibold mb-0.5">Mandatory Staff Review</strong>
                Items marked as high-value must be verified by designated security desk personnel.
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-semibold mb-0.5">Audit Trail</strong>
                Every claim, handover timestamp, and reviewer ID is permanently recorded.
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 space-y-6">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-700" />
            <h2 className="text-lg font-bold text-slate-900">Frequently Asked Questions</h2>
          </div>

          <div className="divide-y divide-slate-100 text-xs sm:text-sm">
            <div className="py-4 first:pt-0">
              <h4 className="font-semibold text-slate-900 mb-1">Where are physical found items kept?</h4>
              <p className="text-slate-500 leading-relaxed">
                Items found in classrooms or labs are typically deposited at the respective Department Office or the Central Library front desk. Items found on campus grounds are held at the Main Security Cabin.
              </p>
            </div>
            <div className="py-4">
              <h4 className="font-semibold text-slate-900 mb-1">How do I prove a found phone or laptop is mine?</h4>
              <p className="text-slate-500 leading-relaxed">
                You will be asked to unlock the device with your passcode or fingerprint in front of the security desk officer, or describe specific wallpaper, stickers, or serial numbers.
              </p>
            </div>
            <div className="py-4 last:pb-0">
              <h4 className="font-semibold text-slate-900 mb-1">What happens to items that remain unclaimed?</h4>
              <p className="text-slate-500 leading-relaxed">
                Unclaimed belongings are retained for a minimum of 90 days. Valuables are handed over to the College Administrative Office in accordance with college policy.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link href="/report/lost" className="btn bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm px-5 py-2.5 rounded-lg font-medium shadow-sm">
            Report Lost Item
          </Link>
          <Link href="/report/found" className="btn bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm px-5 py-2.5 rounded-lg font-medium shadow-sm">
            Report Found Item
          </Link>
        </div>
      </div>
    </div>
  )
}
