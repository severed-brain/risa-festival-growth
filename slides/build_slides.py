"""
build_slides.py — Generates the exact 3-slide widescreen PDF (13.333in x 7.5in)
for Part 1 of the RISA Labs Growth APM Assignment using headless Chrome.

Usage:
  python slides/build_slides.py --name "Your Full Name"
"""

import argparse
import base64
from pathlib import Path
import subprocess
import pymupdf

ROOT = Path(__file__).resolve().parent.parent
OUT_PDF = ROOT.parent / "RISA_Growth_APM_Strategy_Slides.pdf"
DEFAULT_SHOT = Path(
    r"C:\Users\Asus\.gemini\antigravity\brain\aa6ecabf-00d8-4ea2-85bf-47d38b3b73d9\scratch\dashboard_screenshot.png"
)
HTML_PATH = ROOT / "slides" / "slides.html"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def build_html(presenter_name: str, screenshot_b64: str) -> str:
  img_tag = (
      f'<img src="data:image/png;base64,{screenshot_b64}" alt="Live Dashboard" '
      'style="width:100%;height:auto;border-radius:8px;border:1px solid #cbd5e1;box-shadow:0 4px 12px rgba(15,23,42,0.08);" />'
      if screenshot_b64
      else '<div style="padding:24px;border:1px dashed #94a3b8;border-radius:8px;text-align:center;color:#64748b;">Dashboard Screenshot</div>'
  )

  return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>RISA Labs Growth APM Strategy — Challenge A (Mumbai)</title>
<style>
  @page {{
    size: 13.333in 7.5in;
    margin: 0;
  }}
  * {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }}
  body {{
    font-family: 'Segoe UI', Inter, Arial, sans-serif;
    color: #0f172a;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }}
  .slide {{
    width: 13.333in;
    height: 7.5in;
    padding: 0.34in 0.50in;
    position: relative;
    overflow: hidden;
    page-break-after: always;
    background: #f8fafc;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }}
  .slide:last-child {{
    page-break-after: auto;
  }}
  .header {{
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 10px;
    margin-bottom: 12px;
  }}
  .eyebrow {{
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #4f46e5;
    margin-bottom: 3px;
  }}
  h1 {{
    font-size: 24px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.02em;
  }}
  .meta-pill {{
    background: #0f172a;
    color: #f8fafc;
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
  }}
  .grid-2 {{
    display: grid;
    grid-template-columns: 1.12fr 0.88fr;
    gap: 16px;
    flex: 1;
  }}
  .grid-2-equal {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    flex: 1;
  }}
  .card {{
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 13px 15px;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  }}
  .card-title {{
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }}
  .tag {{
    font-size: 10px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 999px;
    background: #eef2ff;
    color: #4338ca;
  }}
  table {{
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
  }}
  th {{
    text-align: left;
    background: #f1f5f9;
    color: #475569;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 9.5px;
    letter-spacing: 0.04em;
    padding: 6px 8px;
    border-bottom: 1px solid #cbd5e1;
  }}
  td {{
    padding: 5px 8px;
    border-bottom: 1px solid #f1f5f9;
    color: #1e293b;
    vertical-align: top;
  }}
  .num {{
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
  }}
  .kpi-row {{
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 10px;
  }}
  .kpi-box {{
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #4f46e5;
    border-radius: 8px;
    padding: 9px 11px;
  }}
  .kpi-box.green {{ border-left-color: #10b981; }}
  .kpi-box.amber {{ border-left-color: #f59e0b; }}
  .kpi-label {{
    font-size: 9.5px;
    font-weight: 700;
    text-transform: uppercase;
    color: #64748b;
  }}
  .kpi-val {{
    font-size: 20px;
    font-weight: 800;
    color: #0f172a;
    margin-top: 2px;
  }}
  .kpi-sub {{
    font-size: 10px;
    color: #475569;
  }}
  .bar-group {{
    margin-top: 6px;
    display: flex;
    flex-direction: column;
    gap: 7px;
  }}
  .bar-label {{
    display: flex;
    justify-content: space-between;
    font-size: 10.5px;
    font-weight: 600;
    margin-bottom: 2px;
  }}
  .bar-track {{
    height: 11px;
    background: #e2e8f0;
    border-radius: 6px;
    overflow: hidden;
    display: flex;
  }}
  .bar-fill {{
    height: 100%;
    background: #4f46e5;
  }}
  .bar-fill.stretch {{
    background: #10b981;
  }}
  .list {{
    font-size: 11px;
    line-height: 1.48;
    color: #334155;
    padding-left: 15px;
  }}
  .list li {{
    margin-bottom: 4px;
  }}
  .badge-scale {{
    color: #047857;
    background: #ecfdf5;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 700;
    font-size: 10px;
    white-space: nowrap;
  }}
  .badge-stop {{
    color: #be123c;
    background: #fff1f2;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 700;
    font-size: 10px;
    white-space: nowrap;
  }}
  .footer {{
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #64748b;
    border-top: 1px solid #e2e8f0;
    padding-top: 7px;
    margin-top: 10px;
  }}
  .highlight-box {{
    background: #eef2ff;
    border: 1px solid #c7d2fe;
    border-radius: 8px;
    padding: 9px 11px;
    font-size: 10.5px;
    color: #312e81;
    line-height: 1.45;
  }}
  .reject-box {{
    background: #fff1f2;
    border: 1px solid #fecdd3;
    border-radius: 8px;
    padding: 9px 11px;
    font-size: 10.5px;
    color: #881337;
    line-height: 1.45;
  }}
</style>
</head>
<body>

<!-- SLIDE 1 -->
<section class="slide">
  <div>
    <div class="header">
      <div>
        <div class="eyebrow">Slide 1 of 3 • Challenge A: Attendee Growth • City: Mumbai</div>
        <h1>How High Can You Aim? Quantitative Funnel & Targets</h1>
      </div>
      <div class="meta-pill">Prepared by: {presenter_name}</div>
    </div>

    <div class="kpi-row">
      <div class="kpi-box">
        <div class="kpi-label">Base Case Attendees</div>
        <div class="kpi-val">10,000</div>
        <div class="kpi-sub">From 83,000 reach &amp; 15,000 regs (67% show-up)</div>
      </div>
      <div class="kpi-box green">
        <div class="kpi-label">Stretch Target Attendees</div>
        <div class="kpi-val">18,000</div>
        <div class="kpi-sub">40+ partner colleges, headliner acts, referral loop</div>
      </div>
      <div class="kpi-box amber">
        <div class="kpi-label">Acquisition Cost Envelope</div>
        <div class="kpi-val">~₹1,75,000</div>
        <div class="kpi-sub">₹17.50/base attendee • ₹70k direct campaign execution</div>
      </div>
    </div>

    <div class="grid-2">
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div class="card">
          <div class="card-title">
            Target Audience Segments (Mumbai MMR)
            <span class="tag">83,000 Addressable Reach</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Segment</th>
                <th class="num">Pool Size</th>
                <th class="num">Conv %</th>
                <th class="num">Attendees</th>
                <th>Prioritization Rationale</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Tier 1: Host College</strong></td>
                <td class="num">3,000</td>
                <td class="num">70%</td>
                <td class="num">2,100</td>
                <td>Zero travel friction, high peer affinity</td>
              </tr>
              <tr>
                <td><strong>Tier 2: Partner Colleges</strong></td>
                <td class="num">20,000</td>
                <td class="num">25%</td>
                <td class="num">5,000</td>
                <td>40 MMR colleges via ambassadors &amp; clubs</td>
              </tr>
              <tr>
                <td><strong>Tier 3: General Youth (18–24)</strong></td>
                <td class="num">50,000</td>
                <td class="num">4%</td>
                <td class="num">2,000</td>
                <td>Instagram Reels UGC discovery</td>
              </tr>
              <tr>
                <td><strong>Tier 4: Alumni &amp; Young Pros</strong></td>
                <td class="num">10,000</td>
                <td class="num">5%</td>
                <td class="num">500</td>
                <td>Higher willingness to pay ₹199 pass</td>
              </tr>
              <tr style="background:#f8fafc;font-weight:700;">
                <td>Total Base Funnel</td>
                <td class="num">83,000</td>
                <td class="num">11.6%</td>
                <td class="num">9,600 (~10K)</td>
                <td>20,000 venue capacity headroom</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="card">
          <div class="card-title">Why Mumbai? (Tier-1 City Justification)</div>
          <ul class="list">
            <li><strong>800+ colleges across MMR:</strong> Highest student density with suburban rail/metro links lowering show-up friction.</li>
            <li><strong>Proven festival culture:</strong> Benchmarks like Mood Indigo (IIT-B), Malhar (St. Xavier's), and Umang (NM) show massive inter-college turnout.</li>
            <li><strong>Digital + corporate ecosystem:</strong> Dense 18–24 Reels penetration and strong brand-cross-promotion readiness.</li>
          </ul>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px;">
        <div class="card">
          <div class="card-title">
            Funnel Model: Base vs. Stretch
            <span class="tag">18% Reg | 67% Show-up</span>
          </div>
          <div class="bar-group">
            <div>
              <div class="bar-label"><span>Reach (Base: 83,000 vs Stretch: 150,000)</span><span>55% / 100%</span></div>
              <div class="bar-track"><div class="bar-fill" style="width:55%;"></div></div>
              <div class="bar-track" style="margin-top:3px;"><div class="bar-fill stretch" style="width:100%;"></div></div>
            </div>
            <div>
              <div class="bar-label"><span>Registrations (Base: 15,000 vs Stretch: 27,000)</span><span>18% of reach</span></div>
              <div class="bar-track"><div class="bar-fill" style="width:55%;"></div></div>
              <div class="bar-track" style="margin-top:3px;"><div class="bar-fill stretch" style="width:100%;"></div></div>
            </div>
            <div>
              <div class="bar-label"><span>Actual Attendees (Base: 10,000 vs Stretch: 18,000)</span><span>67% show-up</span></div>
              <div class="bar-track"><div class="bar-fill" style="width:55%;"></div></div>
              <div class="bar-track" style="margin-top:3px;"><div class="bar-fill stretch" style="width:100%;"></div></div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-title">Acquisition Budget Breakdown (~₹1,75,000)</div>
          <table>
            <tbody>
              <tr><td>Digital Ads (Instagram/Meta @ ₹1.5/reach × 83K)</td><td class="num">₹1,24,500</td></tr>
              <tr><td>Influencer &amp; Campus Ambassador Incentives</td><td class="num">₹30,000</td></tr>
              <tr><td>Offline Collateral (Posters, Campus Stalls)</td><td class="num">₹20,000</td></tr>
              <tr style="font-weight:700;background:#f8fafc;"><td>Total Promotional Envelope</td><td class="num">~₹1,75,000</td></tr>
            </tbody>
          </table>
        </div>

        <div class="highlight-box">
          <strong>Evidence Calibration (CampusFest 2025 Historical Dataset):</strong><br/>
          Observed benchmark achieved <strong>73.2% visitor/registration ratio</strong> (2,050 verified visitors from 2,800 external registrations, incl. 125 walk-ins) at ₹97.86 CPR. We model a conservative <strong>67% show-up rate</strong> for our 10K base target.
        </div>
      </div>
    </div>
  </div>
  <div class="footer">
    <span>RISA Labs Growth APM Assignment • Challenge A: Attendee Growth</span>
    <span>Mumbai Festival Growth Command Center • Slide 1 / 3</span>
  </div>
</section>

<!-- SLIDE 2 -->
<section class="slide">
  <div>
    <div class="header">
      <div>
        <div class="eyebrow">Slide 2 of 3 • Prioritization &amp; Tradeoffs • 21-Day Execution Plan</div>
        <h1>Where Will You Place Your Bets? Five Ranked Strategies</h1>
      </div>
      <div class="meta-pill">Direct Execution Budget: ₹70,000 • 15,000 Target Regs</div>
    </div>

    <div class="card" style="margin-bottom:12px;">
      <div class="card-title">
        Ranked Strategy Portfolio (Scored by Expected ROI, Conversion Velocity &amp; Peer Trust)
        <span class="tag">Target Sum = 15,000 Registrations</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Rank &amp; Strategy</th>
            <th>Core Concept &amp; Why It Works</th>
            <th class="num">Target Regs</th>
            <th class="num">Direct Budget</th>
            <th>Timeline</th>
            <th>Pilot Test &amp; Primary KPIs</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. Campus Ambassador Program</strong><br/><span style="color:#64748b;font-size:10px;">Owner: Riya</span></td>
            <td>1 ambassador × 40 Mumbai colleges (~150 regs each) leveraging high-trust peer referrals.</td>
            <td class="num">6,000<br/><span style="color:#64748b;font-size:9.5px;">(40%)</span></td>
            <td class="num">₹40,000</td>
            <td>3 wks before<br/>(Dec 1–21)</td>
            <td>Pilot 5 colleges; expand if avg &gt;100 regs. KPI: Regs/ambassador, referral conversions.</td>
          </tr>
          <tr>
            <td><strong>2. Instagram Reel Contest</strong><br/><span style="color:#64748b;font-size:10px;">Owner: Aryan</span></td>
            <td>UGC viral loop: "Show your festival look, win free passes" drives organic youth reach.</td>
            <td class="num">2,000<br/><span style="color:#64748b;font-size:9.5px;">(13.3%)</span></td>
            <td class="num">₹15,000</td>
            <td>2 wks before<br/>(Dec 7–21)</td>
            <td>A/B test 2 hashtags; check 48h engagement. KPI: Shares, reach, hashtags, reg conversion.</td>
          </tr>
          <tr>
            <td><strong>3. Free + Paid Ticket Split</strong><br/><span style="color:#64748b;font-size:10px;">Owner: Priya</span></td>
            <td>60% free email-gated passes (frictionless lead capture) + 40% ₹199 premium passes (commitment).</td>
            <td class="num">3,000<br/><span style="color:#64748b;font-size:9.5px;">(20%)</span></td>
            <td class="num">₹0<br/><span style="color:#047857;font-size:9.5px;">(Rev +)</span></td>
            <td>4 wks before<br/>(Nov 28–Dec 21)</td>
            <td>Checkout A/B banner. KPI: Free-to-paid upgrade rate, show-up rate by ticket type.</td>
          </tr>
          <tr>
            <td><strong>4. College Club Tie-ups</strong><br/><span style="color:#64748b;font-size:10px;">Owner: Kunal</span></td>
            <td>Partner with cultural committees, NSS &amp; student bodies across 40 colleges; bulk perk &gt;20 members.</td>
            <td class="num">2,500<br/><span style="color:#64748b;font-size:9.5px;">(16.7%)</span></td>
            <td class="num">₹10,000</td>
            <td>3 wks before<br/>(Dec 1–14)</td>
            <td>Track group code velocity wk 1. KPI: Clubs onboarded, avg group size, show-up rate.</td>
          </tr>
          <tr>
            <td><strong>5. Countdown Email + WhatsApp Drip</strong><br/><span style="color:#64748b;font-size:10px;">Owner: Meera</span></td>
            <td>Automated 7-day drip (lineup highlights, exclusives, reminders) protects 67% show-up rate.</td>
            <td class="num">1,500<br/><span style="color:#64748b;font-size:9.5px;">(10%)</span></td>
            <td class="num">₹5,000</td>
            <td>1 wk before<br/>(Dec 14–21)</td>
            <td>Send-time &amp; copy test. KPI: Email open rate, WhatsApp CTR, final check-in conversion.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="grid-2-equal">
      <div class="card">
        <div class="card-title">Explicit Bets: Where We Double Down</div>
        <ul class="list">
          <li><strong>Double Down #1 — Campus Ambassadors (57% of direct budget):</strong> Highest predictability and peer trust across Mumbai's 40 target colleges.</li>
          <li><strong>Double Down #2 — College Club Tie-ups + Ticket Split:</strong> Bulk cohorts lock in high show-up. In <em>CampusFest 2025</em>, College Partnerships achieved <strong>85.6% show-up (₹80.52 CPV)</strong> and Referrals achieved <strong>₹69.09 CPV</strong> vs. Paid Social at <strong>₹273.53 CPV</strong>.</li>
          <li><strong>Dependency &amp; Synergy:</strong> Ticket Split captures email/WhatsApp consent early so Rank 5 Drip converts hesitant leads before Dec 22.</li>
        </ul>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;">
        <div class="reject-box">
          <strong>Explicitly Deprioritized / Rejected Channels:</strong><br/>
          • <strong>Paid OOH Billboards:</strong> Too expensive for fixed student budget, zero attribution or rapid iteration loop.<br/>
          • <strong>LinkedIn Ads:</strong> Wrong demographic &amp; low intent for college cultural festivals; weak CPM efficiency vs. peer channels.
        </div>
        <div class="card">
          <div class="card-title">Direct Execution Budget Mix (₹70,000)</div>
          <div class="bar-group">
            <div>
              <div class="bar-label"><span>Campus Ambassadors (57.1%)</span><span>₹40,000</span></div>
              <div class="bar-track"><div class="bar-fill" style="width:57.1%;"></div></div>
            </div>
            <div>
              <div class="bar-label"><span>Instagram Reel Contest (21.4%)</span><span>₹15,000</span></div>
              <div class="bar-track"><div class="bar-fill" style="width:21.4%;background:#8b5cf6;"></div></div>
            </div>
            <div>
              <div class="bar-label"><span>College Club Tie-ups (14.3%) + Email/WA Drip (7.1%)</span><span>₹15,000</span></div>
              <div class="bar-track"><div class="bar-fill" style="width:21.4%;background:#10b981;"></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="footer">
    <span>RISA Labs Growth APM Assignment • Strategy Prioritization</span>
    <span>5 Active Bets + 2 Rejected Alternatives • Slide 2 / 3</span>
  </div>
</section>

<!-- SLIDE 3 -->
<section class="slide">
  <div>
    <div class="header">
      <div>
        <div class="eyebrow">Slide 3 of 3 • Experimentation, Guardrails &amp; Live Command Center</div>
        <h1>How Will You Know What's Working? Signals &amp; AI Copilot</h1>
      </div>
      <div class="meta-pill">Live App: Next.js + Supabase + Gemini 3.8 Flash</div>
    </div>

    <div class="grid-2">
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div class="card">
          <div class="card-title">
            Decision Thresholds (Leading Indicators &amp; Pivot Rules)
          </div>
          <table>
            <thead>
              <tr>
                <th>Strategy</th>
                <th>Leading Indicator</th>
                <th>Scale Threshold</th>
                <th>Stop Threshold</th>
                <th>Response Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Campus Ambassadors</strong></td>
                <td>Regs / amb / wk</td>
                <td><span class="badge-scale">&gt; 80 regs/amb</span></td>
                <td><span class="badge-stop">&lt; 30 after wk 1</span></td>
                <td>Reassign kits to high-velocity colleges; bonus tier for top 10 reps.</td>
              </tr>
              <tr>
                <td><strong>Reel Contest</strong></td>
                <td>Daily shares + hashtags</td>
                <td><span class="badge-scale">500 shares / 48h</span></td>
                <td><span class="badge-stop">&lt; 100 in 48h</span></td>
                <td>Switch audio/creative hook; halt paid boost if Reg conv &lt;2%.</td>
              </tr>
              <tr>
                <td><strong>Ticket Split</strong></td>
                <td>Free reg velocity</td>
                <td><span class="badge-scale">&gt; 500 / day</span></td>
                <td><span class="badge-stop">&lt; 100 / day</span></td>
                <td>Reduce form fields; test group bundle CTA on checkout.</td>
              </tr>
              <tr>
                <td><strong>Club Tie-ups</strong></td>
                <td>Clubs signed / day</td>
                <td><span class="badge-scale">3+ clubs / day</span></td>
                <td><span class="badge-stop">&lt; 1 / day after wk 1</span></td>
                <td>Offer backstage/VIP club perk; redirect budget to Ambassadors.</td>
              </tr>
              <tr>
                <td><strong>Email / WhatsApp</strong></td>
                <td>Open rate + CTR</td>
                <td><span class="badge-scale">&gt; 40% open rate</span></td>
                <td><span class="badge-stop">&lt; 15% open rate</span></td>
                <td>Test urgency copy + time-of-day; add QR pass reminder.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="card">
          <div class="card-title">How Our Dashboard &amp; AI Copilot Drive Action</div>
          <ul class="list">
            <li><strong>Live Performance &amp; Attribution:</strong> Tracks Reach → Registrations → Projected Attendees (67% show-up), daily registration velocity, channel CPR, and budget remaining with instant DB sync.</li>
            <li><strong>Automated Diagnostics:</strong> Flags low conversion channels (e.g. high-reach / low-reg IG reels) and approaching deadlines (Club Tie-ups ending Dec 14).</li>
            <li><strong>AI Copilot Workflow (Insight → Confirmed Execution):</strong> Grounded in live Supabase state + historical <em>CampusFest 2025</em> data; diagnoses gaps, computes projections, proposes one-click <code>create_task</code> / <code>reallocate_budget</code> actions upon user confirmation, and flags missing data honestly.</li>
          </ul>
        </div>
      </div>

      <div class="card" style="display:flex;flex-direction:column;justify-content:space-between;">
        <div class="card-title">
          Live Growth Command Center (Screenshot)
          <span class="tag">Dashboard + Campaigns + Tasks + AI</span>
        </div>
        {img_tag}
        <div class="highlight-box" style="margin-top:8px;">
          <strong>Closed-Loop Execution:</strong> Editing any campaign actuals/budget or confirming an AI Copilot task immediately persists to Supabase (or local store) and updates KPIs, funnel bars, and AI context.
        </div>
      </div>
    </div>
  </div>
  <div class="footer">
    <span>RISA Labs Growth APM Assignment • Experimentation &amp; Product Execution</span>
    <span>Scale / Change / Stop Playbook • Slide 3 / 3</span>
  </div>
</section>

</body>
</html>
"""


def main():
  parser = argparse.ArgumentParser()
  parser.add_argument("--name", default="[Your Name]", help="Presenter name on Slide 1")
  parser.add_argument("--screenshot", default=str(DEFAULT_SHOT), help="Path to dashboard screenshot PNG")
  args = parser.parse_args()

  shot_path = Path(args.screenshot)
  b64 = base64.b64encode(shot_path.read_bytes()).decode("ascii") if shot_path.exists() else ""

  HTML_PATH.parent.mkdir(parents=True, exist_ok=True)
  HTML_PATH.write_text(build_html(args.name, b64), encoding="utf-8")

  subprocess.run(
      [
          CHROME,
          "--headless=new",
          "--disable-gpu",
          "--no-sandbox",
          "--print-to-pdf-no-header",
          f"--print-to-pdf={OUT_PDF}",
          HTML_PATH.as_uri(),
      ],
      check=True,
      timeout=30,
  )

  doc = pymupdf.open(str(OUT_PDF))
  print(f"Generated PDF: {OUT_PDF} ({len(doc)} pages)")
  assert len(doc) == 3, f"Expected exactly 3 pages, got {len(doc)}"
  for i, page in enumerate(doc):
    pix = page.get_pixmap(dpi=150)
    png_out = shot_path.parent / f"slide_{i+1}_preview.png"
    pix.save(str(png_out))
    print(f"Rendered preview: {png_out}")


if __name__ == "__main__":
  main()
