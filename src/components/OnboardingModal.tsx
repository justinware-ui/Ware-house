import shellSvg from '@/assets/onboarding-modal-shell.svg'
import manualCardSvg from '@/assets/onboarding-card-manual.svg'
import aiCardSvg from '@/assets/onboarding-card-ai.svg'

type OnboardingChoice = 'ai' | 'manual'

type Props = {
  onChoice: (choice: OnboardingChoice) => void
}

const cardButtonClass =
  'w-[38%] max-w-[300px] rounded-2xl border border-transparent bg-transparent p-0 shadow-none transition-[box-shadow,border-color,transform] duration-200 hover:border-[#FC6839] hover:shadow-[0_20px_40px_rgba(48,41,33,0.18)] hover:scale-[1.01] focus:outline-none focus-visible:border-[#FC6839] focus-visible:shadow-[0_20px_40px_rgba(48,41,33,0.18)]'

export default function OnboardingModal({ onChoice }: Props) {
  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="relative w-full max-w-[811px]">
        <img src={shellSvg} alt="" className="w-full h-auto pointer-events-none select-none" aria-hidden />

        <div className="absolute inset-0">
          <h2 id="onboarding-title" className="sr-only">
            Welcome to Consensus Demos
          </h2>

          {/* Cards centered so shell "or" (y≈52%) aligns with card vertical midpoint */}
          <div
            className="absolute left-0 right-0 flex items-center justify-center gap-14 px-[2%]"
            style={{ top: '52%', transform: 'translateY(-50%)' }}
          >
            <button
              type="button"
              onClick={() => onChoice('ai')}
              className={cardButtonClass}
              aria-label="Use the Consensus AI Agent"
            >
              <img src={aiCardSvg} alt="" className="w-full h-auto pointer-events-none rounded-2xl" />
            </button>

            <button
              type="button"
              onClick={() => onChoice('manual')}
              className={cardButtonClass}
              aria-label="Start by dragging an interaction or content onto the stage"
            >
              <img src={manualCardSvg} alt="" className="w-full h-auto pointer-events-none rounded-2xl" />
            </button>
          </div>

          {/* Cover baked-in checked checkbox; shell SVG already shows the label text */}
          <div
            className="absolute pointer-events-none"
            style={{ left: '31%', bottom: '8.9%' }}
            aria-hidden
          >
            <span className="block h-4 w-4 rounded border border-[#D0CBC6] bg-white" />
          </div>
        </div>
      </div>
    </div>
  )
}
