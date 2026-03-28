#!/usr/bin/env node
/**
 * RoWiki JP — コード自動更新スクリプト
 * 使い方: node api/update-codes.js
 * cron設定例: 0 6 * * * node /path/to/api/update-codes.js  (毎朝6時に実行)
 * 
 * 必要な環境変数:
 *   ANTHROPIC_API_KEY=sk-ant-...
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, '../data/games.json');
const LOG_PATH = path.join(__dirname, '../data/update-log.json');

const client = new Anthropic();

// 調査するゲームのリスト（id: ゲームID、searchQuery: 検索クエリ）
const GAMES_TO_CHECK = [
  { id: 'blox-fruits',         query: 'Blox Fruits codes March 2026 working list' },
  { id: 'grow-a-garden',       query: 'Grow a Garden Roblox codes 2026 working' },
  { id: '99-nights-in-the-forest', query: '99 Nights in the Forest Roblox codes 2026' },
  { id: 'steal-a-brainrot',    query: 'Steal a Brainrot codes 2026 working' },
  { id: 'adopt-me',            query: 'Adopt Me codes 2026 working list' },
  { id: 'murder-mystery-2',    query: 'Murder Mystery 2 codes 2026 working' },
  { id: 'anime-vanguards',     query: 'Anime Vanguards codes 2026 working gems' },
  { id: 'fisch',               query: 'Fisch Roblox codes 2026 working' },
  { id: 'blue-lock-rivals',    query: 'Blue Lock Rivals codes 2026 working' },
  { id: 'basketball-zero',     query: 'Basketball Zero Roblox codes 2026' },
  { id: 'pet-simulator-99',    query: 'Pet Simulator 99 codes 2026 working' },
  { id: 'bee-swarm-simulator', query: 'Bee Swarm Simulator codes 2026' },
  { id: 'blade-ball',          query: 'Blade Ball codes 2026 working' },
  { id: 'anime-last-stand',    query: 'Anime Last Stand codes 2026 working' },
  { id: 'jujutsu-infinite',    query: 'Jujutsu Infinite codes 2026 working spins' },
  { id: 'meme-sea',            query: 'Meme Sea Roblox codes 2026' },
  { id: 'plants-vs-brainrots', query: 'Plants vs Brainrots codes 2026' },
  { id: 'dandy-world',         query: 'Dandys World codes 2026 working' },
];

async function searchForCodes(gameQuery) {
  /**
   * Claude APIのweb_search toolを使って最新コードを検索
   */
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    tools: [{
      type: 'web_search_20250305',
      name: 'web_search'
    }],
    system: `あなたはRobloxゲームのコード情報を収集するアシスタントです。
ウェブ検索で最新の有効なコードを見つけ、必ずJSON形式のみで返してください。
余分なテキストは不要です。フォーマット:
{"codes": [{"code": "CODE_HERE", "reward": "報酬の説明", "new": false}], "noCode": false}
コードが一つもない場合: {"codes": [], "noCode": true}`,
    messages: [{
      role: 'user',
      content: `次のRobloxゲームの現在有効なコードをウェブ検索して見つけてください: ${gameQuery}
見つかった全ての有効なコードをJSONで返してください。期限切れのコードは含めないでください。`
    }]
  });

  // レスポンスからテキストを取得
  const text = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('');

  // JSONを抽出
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch(e) {}
  return { codes: [], noCode: false };
}

async function updateGameCodes() {
  console.log('🚀 RoWiki JP コード更新開始:', new Date().toLocaleString('ja-JP'));

  // 現在のゲームデータを読み込む
  let games;
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf-8');
    games = JSON.parse(raw);
  } catch(e) {
    console.error('❌ games.json の読み込みに失敗:', e.message);
    process.exit(1);
  }

  const log = {
    timestamp: new Date().toISOString(),
    updates: [],
    errors: []
  };

  let updatedCount = 0;

  for (const target of GAMES_TO_CHECK) {
    const game = games.find(g => g.id === target.id);
    if (!game) {
      console.log(`⚠️  スキップ: ${target.id} (データなし)`);
      continue;
    }

    console.log(`🔍 検索中: ${game.name}...`);

    try {
      const result = await searchForCodes(target.query);
      
      if (result.codes && result.codes.length > 0) {
        // 新しいコードとマージ（重複を除く）
        const existingCodes = new Set(game.codes.map(c => c.code));
        const newCodes = result.codes.filter(c => !existingCodes.has(c.code));
        
        // 既存コードを維持しつつ新しいコードに「new: true」をつける
        const mergedCodes = [
          ...result.codes.map(c => ({
            ...c,
            new: !existingCodes.has(c.code)
          }))
        ];

        game.codes = mergedCodes;
        game.updated = new Date().toISOString().split('T')[0];
        updatedCount++;

        const entry = { id: target.id, name: game.name, codes: mergedCodes.length, newCodes: newCodes.length };
        log.updates.push(entry);
        console.log(`  ✅ ${game.name}: ${mergedCodes.length}個のコード (新規 ${newCodes.length}個)`);
      } else if (result.noCode) {
        game.codes = [];
        game.updated = new Date().toISOString().split('T')[0];
        log.updates.push({ id: target.id, name: game.name, codes: 0, newCodes: 0 });
        console.log(`  ℹ️  ${game.name}: コードなし`);
      } else {
        console.log(`  ⚠️  ${game.name}: 検索結果なし（前回のデータを保持）`);
      }

      // APIレート制限を避けるための待機
      await new Promise(r => setTimeout(r, 2000));
    } catch(e) {
      console.error(`  ❌ ${game.name}: エラー — ${e.message}`);
      log.errors.push({ id: target.id, name: game.name, error: e.message });
    }
  }

  // 更新されたデータを保存
  try {
    await fs.writeFile(DATA_PATH, JSON.stringify(games, null, 2), 'utf-8');
    console.log(`\n✅ games.json を更新しました (${updatedCount}ゲーム更新)`);
  } catch(e) {
    console.error('❌ games.json の書き込みに失敗:', e.message);
  }

  // ログを保存
  try {
    let logs = [];
    try {
      const existing = await fs.readFile(LOG_PATH, 'utf-8');
      logs = JSON.parse(existing);
    } catch(e) {}
    logs.unshift(log);
    logs = logs.slice(0, 30); // 直近30件のみ保持
    await fs.writeFile(LOG_PATH, JSON.stringify(logs, null, 2), 'utf-8');
    console.log('📝 更新ログを保存しました');
  } catch(e) {
    console.error('⚠️  ログ保存エラー:', e.message);
  }

  console.log(`\n🎉 更新完了! ${updatedCount}/${GAMES_TO_CHECK.length} ゲームを更新しました`);
  console.log(`エラー数: ${log.errors.length}`);
}

// 実行
updateGameCodes().catch(console.error);
