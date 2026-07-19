# あねちゃん — LINE エージェント秘書

LINEでやりとりする個人用AI秘書「あねちゃん」。自由対話、Googleカレンダー連携、タスク管理、メモ管理、単発リマインダーに対応。

## 特徴

- LLMは **Google Gemini API 無料枠** を使用（Claude API等の不可避な課金は無し）
- ホスティングは **Render無料プラン + Neon無料Postgres + 外部cron（cron-job.orgなど）** の$0構成
- 安定稼働を優先し、Web検索・レストラン提案・毎朝の自動配信のようなWeb検索依存機能は今回のスコープには含めていない（将来の拡張候補）

## 費用・運用上の注意点（必ず読むこと）

- **Gemini APIキーを発行したGoogle Cloudプロジェクトには、絶対に請求先アカウント(billing account)を紐付けないこと。** これにより無料枠のレート制限を超えても自動課金は発生せず、エラーで呼び出しが失敗するだけになる。
- LINEのPush配信には無料枠の上限がある。返信(reply)は枠を消費しないが、リマインダー送信は全てPush。運用しながらLINE Developersコンソールで消費量を確認する。
- Google OAuthのリフレッシュトークンは、個人のGmailアカウント（OAuth同意画面が「External」+「Testing」状態）だと7日で失効し得る。**下記セットアップ手順3で自分自身を「テストユーザー」として登録すること**で回避する。
- Render無料プランは一定時間アクセスがないとスリープする。5分毎に`/cron/reminders`を叩く外部cronがスリープ防止も兼ねる。
- Neonの無料枠も約5分の無操作でコンピュートがサスペンドするが、上記と同じ5分毎のcronがこちらも防いでいる。
- 外部cronの発火失敗を検知する監視は入れていない。リマインダーが来ない場合はRenderのログを手動で確認する。
- 各無料枠の上限は変更され得るため、セットアップ時に各サービスの最新の制限を確認すること。

## セットアップ手順

1. **LINE Developers Console**: プロバイダーとMessaging APIチャンネルを作成し、Channel SecretとChannel Access Tokenを取得する。
2. LINE公式アカウントマネージャーで自動応答をオフにする。
3. **Google Cloud Console**: プロジェクトを作成 → Calendar APIを有効化 → OAuth同意画面を「External」で作成（Testing状態のまま）→ **自分自身をテストユーザーとして追加**（これをしないとリフレッシュトークンが7日で失効する）→ OAuth2クライアントIDを作成し、リダイレクトURI（`https://<render-host>/auth/google/callback`）を登録する。Maps系APIは有効化しない（課金トリガーを避けるため）。
4. **Google AI Studio** (https://ai.google.dev) でGemini APIキーを無料取得する。**このGoogle Cloudプロジェクトに請求先アカウントを紐付けないこと**を確認し、現在の無料枠のレート制限を確認しておく。
5. **Neon** (https://neon.tech) でプロジェクトを作成し、無料Postgresの接続文字列を取得する。
6. **Render** (https://render.com) で無料Web Serviceを作成し、このリポジトリのDockerfileからデプロイする。環境変数（`.env.example`参照）を設定する。
7. `npm install` 後、`npm run db:push` でNeonにスキーマを適用する（ローカルの`.env`に`DATABASE_URL`を設定しておく）。
8. LINE Developers ConsoleでWebhook URLを `https://<render-host>/webhook` に設定し、Verifyする。
9. **cron-job.org** 等の無料外部cronサービスで `POST https://<render-host>/cron/reminders` を5分毎に登録する。リクエストヘッダーに `x-cron-secret: <CRON_SECRETの値>` を付与する。
10. LINEでボットを友だち追加する。予定登録などGoogleカレンダー連携が必要な操作を頼むと、あねちゃんが認可リンクを案内するので、それを開いてGoogleアカウントを連携する。
11. 動作確認: 雑談、予定登録（カレンダーに反映されるか、当日9時・時刻指定ありなら開始1時間前にもリマインドが来るか）、タスク追加（期限をつけて期限日の9時と15時にリマインドされるか）、メモの追加・検索、単発リマインダーの作成・キャンセル。

## ローカル開発

```bash
cp .env.example .env   # 値を埋める
npm install
npm run db:push        # Neonへスキーマ適用
npm run dev            # tsx watch で起動
```

ローカルでLINE WebhookやGoogle OAuthリダイレクトを試すには、ngrok等で一時的に公開URLを発行する。

```bash
ngrok http 3000
```

`/cron/reminders` はcron相当の動作をcurlで直接確認できる。

```bash
curl -X POST https://<host>/cron/reminders -H "x-cron-secret: <CRON_SECRETの値>"
```

## 将来の拡張候補（今回は見送り）

- Web検索・レストラン提案・毎朝の自動配信（損保業界ニュース・米国株ニュース・天気連動の傘アドバイス）: 今回の5機能の安定運用が確認できてから、Gemini無料枠の検索グラウンディングクォータの実際の挙動を見つつ検討する。
- 繰り返しリマインダー。
- Google Maps Platformの請求先アカウントを設定した後: 移動時間を考慮した「そろそろ出発」通知、位置情報付きの高精度なレストラン提案。
