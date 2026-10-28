#!/usr/bin/env bash
set -e

REPO="badruddinshodiev3-droid/arzon-tj"
BRANCH="main"

echo "=========================================================="
echo "  Arzon.tj — Фиристодани тағйирот ва сохтани APK-и нав"
echo "=========================================================="

TOKEN="$1"
if [ -z "$TOKEN" ]; then
  TOKEN="$GITHUB_TOKEN"
fi

if [ -z "$TOKEN" ]; then
  echo ""
  echo "Барои фиристодани код ба GitHub token лозим аст."
  echo "Тарзи истифода:"
  echo "  bash scripts/push-to-github.sh <GITHUB_TOKEN>"
  echo "Ё:"
  echo "  export GITHUB_TOKEN=ghp_ва_ғайра"
  echo "  npm run sync:github"
  echo ""
  echo "Чӣ тавр Token гирифтан мумкин:"
  echo "1. Ба https://github.com/settings/tokens гузаред"
  echo "2. 'Generate new token (classic)' -> 'repo' ро интихоб кунед"
  echo "3. Токенро нусхабардорӣ карда, бо фармони боло иҷро кунед"
  echo "=========================================================="
  exit 1
fi

git remote set-url origin "https://${TOKEN}@github.com/${REPO}.git"
git add -A
git commit -m "feat: Arzon.tj sync $(date '+%Y-%m-%d %H:%M:%S') with 24 ads and real-time chat" || true

echo ""
echo "🚀 Фиристодани код ба GitHub (шохаи ${BRANCH})..."
git push origin "${BRANCH}" --force

echo ""
echo "✅ Код ба GitHub фиристода шуд!"
echo "🔄 GitHub Actions ба таври автоматӣ сохтани APK-ро оғоз кард."
echo "📱 Шумо метавонед ба саҳифаи зерин рафта, равандро бинед ва APK-ро боргирӣ кунед:"
echo "   https://github.com/${REPO}/actions"
echo "=========================================================="
