import re

with open("App.tsx", "r") as f:
    content = f.read()

# Fix MenuItem
content = re.sub(
    r"pl-12 pr-5 py-3 transition-colors border-b border-gray-100/50 dark:border-gray-800/50 last:border-none",
    r"mx-3 my-1 pl-10 pr-3 py-2.5 rounded-lg transition-colors",
    content
)

# Fix Dashboard Button
content = re.sub(
    r"w-full flex items-center gap-3 px-5 py-4 font-bold transition-colors border-b border-gray-100 dark:border-gray-800 \$\{\n                  currentView === 'dashboard'",
    r"w-[calc(100%-24px)] mx-3 my-1 rounded-lg flex items-center gap-3 px-4 py-3.5 font-bold transition-colors ${\n                  currentView === 'dashboard'",
    content
)

# Fix Daftar Susunan Pegawai Button
content = re.sub(
    r"w-full flex items-center gap-3 px-5 py-4 font-bold transition-colors border-b border-gray-100 dark:border-gray-800 \$\{\n                currentView === 'susunan-pegawai'",
    r"w-[calc(100%-24px)] mx-3 my-1 rounded-lg flex items-center gap-3 px-4 py-3.5 font-bold transition-colors ${\n                currentView === 'susunan-pegawai'",
    content
)

# Fix Accordion Parent buttons (Layanan Kenaikan Pangkat, Layanan KGB, etc)
# They look like: className={`w-full flex items-center justify-between px-5 py-4 font-bold transition-colors ${
content = re.sub(
    r"className=\{\`w-full flex items-center justify-between px-5 py-4 font-bold transition-colors \$\{(?=\n                  \(isKenaikanPangkatExpanded)",
    r"className={`w-[calc(100%-24px)] mx-3 my-1 rounded-lg flex items-center justify-between px-4 py-3.5 font-bold transition-colors ${",
    content
)
content = re.sub(
    r"className=\{\`w-full flex items-center justify-between px-5 py-4 font-bold transition-colors \$\{(?=\n                  \(isLayananKgbExpanded)",
    r"className={`w-[calc(100%-24px)] mx-3 my-1 rounded-lg flex items-center justify-between px-4 py-3.5 font-bold transition-colors ${",
    content
)
content = re.sub(
    r"className=\{\`w-full flex items-center justify-between px-5 py-4 font-bold transition-colors \$\{(?=\n                  \(isPensiunExpanded)",
    r"className={`w-[calc(100%-24px)] mx-3 my-1 rounded-lg flex items-center justify-between px-4 py-3.5 font-bold transition-colors ${",
    content
)
content = re.sub(
    r"className=\{\`w-full flex items-center justify-between px-5 py-4 font-bold transition-colors \$\{(?=\n                  \(isJamKerjaExpanded)",
    r"className={`w-[calc(100%-24px)] mx-3 my-1 rounded-lg flex items-center justify-between px-4 py-3.5 font-bold transition-colors ${",
    content
)

# Fix FAQ
content = re.sub(
    r"className=\{\`w-full flex items-center gap-3 px-5 py-4 font-bold transition-colors border-b border-gray-100 dark:border-gray-800 mt-2 \$\{\n                currentView === 'faq'",
    r"className={`w-[calc(100%-24px)] mx-3 my-2 rounded-lg flex items-center gap-3 px-4 py-3.5 font-bold transition-colors ${\n                currentView === 'faq'",
    content
)

# Fix Logout
content = re.sub(
    r"className=\"w-full flex items-center gap-3 px-5 py-4 font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors cursor-pointer mt-auto\"",
    r"className=\"w-[calc(100%-24px)] mx-3 mb-3 rounded-lg flex items-center gap-3 px-4 py-3.5 font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors cursor-pointer mt-auto\"",
    content
)

# Clean up bg-gray-50/50 nested backgrounds
content = re.sub(r"className=\"flex flex-col bg-gray-50/50 dark:bg-gray-900 py-1\"", r"className=\"flex flex-col py-1\"", content)

with open("App.tsx", "w") as f:
    f.write(content)
