'use client';

export default function AnnouncementBar() {
  return (
    <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 px-6 text-center">
      <p className="text-sm md:text-base font-medium">
        The skills you learn on Skillprobe can help land the job on Indeed.{' '}
        <a href="#" className="underline hover:text-pink-100 transition-colors">
          Learn more
        </a>
      </p>
    </div>
  );
}
