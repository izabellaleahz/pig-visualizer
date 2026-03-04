interface LoadingProps {
  message?: string;
  progress?: number;
}

export default function Loading({ message = 'Loading...', progress }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute inset-0 border-4 border-pink-200 dark:border-pink-900 rounded-full" />
        <div
          className="absolute inset-0 border-4 border-pink-500 rounded-full animate-spin"
          style={{ borderRightColor: 'transparent', borderBottomColor: 'transparent' }}
        />
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{message}</p>
      {progress !== undefined && progress > 0 && (
        <div className="mt-3 w-48">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-pink-500 transition-all duration-300 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-1">
            {progress}%
          </p>
        </div>
      )}
    </div>
  );
}
