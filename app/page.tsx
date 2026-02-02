export default function Home() {
  return (
    <div className="text-center py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Welcome to Meal Planner
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        Plan your weekly meals and generate grocery lists effortlessly
      </p>
      <div className="flex justify-center gap-4">
        <a
          href="/recipes"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
        >
          Browse Recipes
        </a>
        <a
          href="/planner"
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700"
        >
          Weekly Planner
        </a>
      </div>
    </div>
  )
}
