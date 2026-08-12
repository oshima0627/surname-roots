import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-12 text-center">
      <h1 className="text-2xl font-bold">この苗字はまだ収録されていません</h1>
      <p className="mt-4 text-stone-600">
        収録数を少しずつ増やしています。別の苗字を探してみてください。
      </p>
      <Link href="/" className="mt-8 inline-block underline">
        苗字を検索する
      </Link>
    </div>
  );
}
