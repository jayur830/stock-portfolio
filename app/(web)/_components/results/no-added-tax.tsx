export default function NoAddedTax() {
  return (
    <div className="border-t pt-3">
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
        <svg
          className="w-4 h-4 md:w-5 md:h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-xs md:text-sm font-medium">분리과세로 과세 종결 (추가 납부 없음)</span>
      </div>
    </div>
  );
}
