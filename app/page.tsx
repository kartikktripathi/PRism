import { Rock_Salt } from "next/font/google";

const rockSalt = Rock_Salt({
  weight: "400",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <h1 className={`${rockSalt.className} text-[8vw]`}>Coming Soon!</h1>
    </div>
  );
}
