import React, { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { C, F, R, Tint, type TintName } from '@/constants/theme';
import { Badge, Button, Card, Field, Row, Screen, T, TopBar } from '@/components/ui';
import { Icon, type IconName } from '@/components/Icon';
import { useStore } from '@/lib/store';
import { claudeProvider, proxyProvider } from '@/lib/ai';
import { deleteClaudeKey, getClaudeKey, maskKey, setClaudeKey } from '@/lib/secrets';
import type { AiMode } from '@/lib/types';

const OPTIONS: { mode: AiMode; title: string; sub: string; icon: IconName; tint: TintName }[] = [
  { mode: 'claude', title: 'My Claude account', sub: 'Your own Anthropic API key. Reads photos and answers anything. You pay Anthropic per question.', icon: 'spark', tint: 'lavender' },
  { mode: 'demo', title: 'Demo mode', sub: 'Free and works offline. Answers from built-in guides, but cannot read photos.', icon: 'book', tint: 'mint' },
  { mode: 'server', title: 'My own server', sub: 'For developers: a Pawgress AI server you run (see the server folder).', icon: 'chat', tint: 'sky' },
];

const KEYS_URL = 'https://console.anthropic.com/settings/keys';

export default function AiSettings() {
  const { state, update } = useStore();
  const dog = state.dog;
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [proxy, setProxy] = useState(state.aiProxyUrl);
  const [token, setToken] = useState(state.aiToken);
  const [status, setStatus] = useState('');
  const [testing, setTesting] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    getClaudeKey().then(setSavedKey);
  }, []);

  const setMode = (mode: AiMode) => {
    update((s) => ({ ...s, aiMode: mode }));
    setStatus('');
  };

  const test = async (provider: ReturnType<typeof claudeProvider>) => {
    setTesting(true);
    setStatus('Testing the connection…');
    try {
      const r = await provider.send([{ role: 'user', text: 'Reply with one short friendly sentence to confirm you are connected.' }], dog);
      setStatus(`Connected. Claude says: "${r.text.slice(0, 90)}"`);
      return true;
    } catch (e: any) {
      setStatus(e?.message ?? 'Could not connect.');
      return false;
    } finally {
      setTesting(false);
    }
  };

  const saveClaude = async () => {
    const key = keyInput.trim();
    if (!key) return;
    if (!key.startsWith('sk-ant-')) {
      setStatus('That does not look like an Anthropic API key. Keys start with "sk-ant-".');
      return;
    }
    const ok = await test(claudeProvider(key));
    if (!ok) return;
    await setClaudeKey(key);
    setSavedKey(key);
    setKeyInput('');
    update((s) => ({ ...s, aiMode: 'claude' }));
  };

  const removeClaude = async () => {
    await deleteClaudeKey();
    setSavedKey(null);
    setConfirmRemove(false);
    update((s) => ({ ...s, aiMode: s.aiMode === 'claude' ? 'demo' : s.aiMode }));
    setStatus('Key removed from this phone. The chat is back in demo mode.');
  };

  const saveServer = async () => {
    const url = proxy.trim();
    update((s) => ({ ...s, aiProxyUrl: url, aiToken: token.trim(), aiMode: url ? 'server' : s.aiMode }));
    if (url) await test(proxyProvider(url, token.trim()));
  };

  const mode = state.aiMode;
  const claudeReady = mode === 'claude' && !!savedKey;

  return (
    <Screen tabs={false} header={<TopBar title="AI connection" />}>
      <T style={{ color: C.inkSoft }}>Choose what powers the Ask chat. Each person connects their own account, so nobody shares one key.</T>

      <View style={{ gap: 10 }}>
        {OPTIONS.map((o) => {
          const on = mode === o.mode;
          return (
            <Pressable key={o.mode} onPress={() => setMode(o.mode)} accessibilityRole="radio" accessibilityState={{ selected: on }}>
              <View style={[styles.option, on && { borderColor: Tint[o.tint][1], backgroundColor: Tint[o.tint][0] }]}>
                <View style={[styles.optIcon, { backgroundColor: on ? C.paper : Tint[o.tint][0] }]}>
                  <Icon name={o.icon} size={20} color={Tint[o.tint][1]} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Row gap={6}>
                    <T v="bodyStrong">{o.title}</T>
                    {o.mode === 'claude' && <Badge text="Best" tint="peach" />}
                  </Row>
                  <T v="small" style={{ color: C.ink }}>
                    {o.sub}
                  </T>
                </View>
                <View style={[styles.radio, on && { borderColor: C.pill }]}>{on && <View style={styles.radioDot} />}</View>
              </View>
            </Pressable>
          );
        })}
      </View>

      {mode === 'claude' && (
        <Animated.View entering={FadeInDown} style={{ gap: 12 }}>
          {savedKey ? (
            <Card style={{ gap: 10 }}>
              <Row gap={8}>
                <Icon name="check" size={18} color={C.ok} strokeWidth={3} />
                <T v="bodyStrong">Connected with key {maskKey(savedKey)}</T>
              </Row>
              <T v="small">The key is stored in this phone's secure storage. It is not included in backups.</T>
              <Row gap={10}>
                <Button label="Test" kind="soft" icon="spark" style={{ flex: 1 }} onPress={() => test(claudeProvider(savedKey))} disabled={testing} />
                {confirmRemove ? (
                  <Button label="Yes, remove" kind="danger" style={{ flex: 1 }} onPress={removeClaude} />
                ) : (
                  <Button label="Remove key" kind="ghost" icon="trash" style={{ flex: 1 }} onPress={() => setConfirmRemove(true)} />
                )}
              </Row>
            </Card>
          ) : (
            <Card style={{ gap: 12 }}>
              <T v="h2">Connect your Claude account</T>
              <Step n={1} text="Open the Anthropic Console and sign in or create an account." />
              <Step n={2} text="Under Billing, add a little credit. A typical question with a photo costs about 1 to 5 US cents." />
              <Step n={3} text='Under API keys, tap "Create key", name it Pawgress, and copy it.' />
              <Step n={4} text="Paste it below and tap Connect." />
              <Button label="Open Anthropic Console" kind="soft" icon="share" onPress={() => Linking.openURL(KEYS_URL).catch(() => setStatus(`Open ${KEYS_URL} in your browser.`))} />
              <Field label="API key" value={keyInput} onChangeText={setKeyInput} placeholder="sk-ant-…" autoCapitalize="none" autoCorrect={false} secureTextEntry={Platform.OS !== 'web'} />
              <Button label={testing ? 'Connecting…' : 'Connect'} icon="check" onPress={saveClaude} disabled={!keyInput.trim() || testing} />
              <T v="small">
                A Claude Pro or Max chat subscription can't be used by other apps. Apps need an API key from the Console, which is billed separately per use.
              </T>
            </Card>
          )}
          <T v="small">Your key stays on this phone. Questions and photos you send go straight to Anthropic to get an answer.</T>
        </Animated.View>
      )}

      {mode === 'server' && (
        <Animated.View entering={FadeInDown}>
          <Card style={{ gap: 12 }}>
            <T>Run the server in the project's server folder with your key, then enter its address. Your phone and the server must be able to reach each other.</T>
            <Field label="Server address" value={proxy} onChangeText={setProxy} placeholder="http://192.168.1.20:8787" autoCapitalize="none" autoCorrect={false} keyboardType={Platform.OS === 'ios' ? 'url' : 'default'} />
            <Field label="Access code (optional)" value={token} onChangeText={setToken} placeholder="Matches APP_TOKEN on the server" autoCapitalize="none" secureTextEntry />
            <Button label="Save and test" icon="spark" kind="dark" onPress={saveServer} disabled={testing} />
          </Card>
        </Animated.View>
      )}

      {mode === 'demo' && (
        <Card tint="mint" style={{ gap: 4 }}>
          <T v="h3">Demo mode is on</T>
          <T>It answers food-safety, calorie, potty, exercise, grooming and training questions from Pawgress's built-in guides, tailored to {dog?.name ?? 'your dog'}. Switch to your Claude account for photos and open questions.</T>
        </Card>
      )}

      {status ? (
        <View style={[styles.status, { backgroundColor: /^Connected/.test(status) ? C.okSoft : /Testing/.test(status) ? C.lavender : C.warnSoft }]}>
          <T v="small" style={{ color: C.ink }}>
            {status}
          </T>
        </View>
      ) : null}
      {mode === 'claude' && !claudeReady && !savedKey && <T v="small">Until a key is connected, the chat keeps using demo mode.</T>}
    </Screen>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <Row gap={10} style={{ alignItems: 'flex-start' }}>
      <View style={styles.stepNum}>
        <T v="bodyStrong" style={{ fontSize: 12, color: '#fff', fontFamily: F.bodyHeavy }}>
          {n}
        </T>
      </View>
      <T style={{ flex: 1 }}>{text}</T>
    </Row>
  );
}

const styles = StyleSheet.create({
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.paper, borderRadius: R.lg, padding: 14, borderWidth: 2, borderColor: 'transparent' },
  optIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: C.inkFaint, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.pill },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.lavenderDeep, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  status: { borderRadius: R.md, padding: 12 },
});
