import React, { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput, View, type ScrollViewInstance } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { C, F, R, Tint, shadow } from '@/constants/theme';
import { useKeyboardVisible, useTabBarSpace } from '@/hooks/useTabBarSpace';
import { getClaudeKey } from '@/lib/secrets';
import { Press, Row, T } from '@/components/ui';
import { Icon, type IconName } from '@/components/Icon';
import { Mascot } from '@/components/Mascot';
import { useStore } from '@/lib/store';
import { getProvider, toOutgoing } from '@/lib/ai';
import type { ChatMessage } from '@/lib/types';
import { uid } from '@/lib/util';

interface Attachment {
  uri: string;
  base64?: string;
}

function TypingDots() {
  const d0 = useSharedValue(0);
  const d1 = useSharedValue(0);
  const d2 = useSharedValue(0);
  useEffect(() => {
    [d0, d1, d2].forEach((d, i) => {
      d.set(withDelay(i * 150, withRepeat(withSequence(withTiming(1, { duration: 300 }), withTiming(0, { duration: 300 })), -1, false)));
    });
  }, [d0, d1, d2]);
  return (
    <View style={[styles.botBubble, { flexDirection: 'row', gap: 5, paddingVertical: 14 }]}>
      {[d0, d1, d2].map((d, i) => (
        <Dot key={i} v={d} />
      ))}
    </View>
  );
}
function Dot({ v }: { v: { value: number } }) {
  const a = useAnimatedStyle(() => ({ opacity: 0.35 + v.value * 0.65, transform: [{ translateY: -v.value * 4 }] }));
  return <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.lavenderDeep }, a]} />;
}

const VERDICT = {
  safe: { label: 'Safe in moderation', tint: 'mint' as const, icon: 'check' as IconName },
  caution: { label: 'Feed with care', tint: 'butter' as const, icon: 'bulb' as IconName },
  unsafe: { label: 'Not safe', tint: 'rose' as const, icon: 'close' as IconName },
};

export default function Ask() {
  const { state, update } = useStore();
  const dog = state.dog!;
  const [claudeKey, setClaudeKeyState] = useState<string | null>(null);
  // Re-read the key whenever the tab is shown, in case it was just added or removed in settings.
  useFocusEffect(
    useCallback(() => {
      getClaudeKey().then(setClaudeKeyState);
    }, []),
  );
  const provider = getProvider(state.aiMode, { proxyUrl: state.aiProxyUrl, token: state.aiToken, claudeKey });
  const tabSpace = useTabBarSpace();
  const keyboard = useKeyboardVisible();
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const scroller = useRef<ScrollViewInstance>(null);

  useEffect(() => {
    setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 80);
  }, [state.chat.length, busy]);

  const pick = async (camera: boolean) => {
    setError('');
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError(camera ? 'Camera permission is needed to take a photo. You can turn it on in Settings.' : 'Photo access is needed to attach a picture.');
      return;
    }
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8 };
    const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled || !res.assets[0]) return;
    const asset = res.assets[0];
    try {
      // Shrink to a phone-friendly size so uploads are quick and cheap.
      const ctx = ImageManipulator.manipulate(asset.uri);
      if (asset.width > 1024) ctx.resize({ width: 1024 });
      const ref = await ctx.renderAsync();
      const out = await ref.saveAsync({ compress: 0.6, format: SaveFormat.JPEG, base64: true });
      setAttachment({ uri: out.uri, base64: out.base64 });
    } catch {
      setAttachment({ uri: asset.uri });
    }
  };

  const send = async (preset?: string) => {
    const body = (preset ?? text).trim();
    if ((!body && !attachment) || busy) return;
    setError('');
    const userMsg: ChatMessage = { id: uid(), role: 'user', text: body || `What is this, and is it okay for ${dog.name}?`, imageUri: attachment?.uri, at: new Date().toISOString() };
    const history = [...state.chat, userMsg];
    update((s) => ({ ...s, chat: [...s.chat, userMsg] }));
    const img = attachment?.base64 ? { data: attachment.base64, mediaType: 'image/jpeg' } : attachment ? { data: '', mediaType: 'image/jpeg' } : undefined;
    setText('');
    setAttachment(null);
    setBusy(true);
    try {
      const reply = await provider.send(toOutgoing(history, img), dog);
      update((s) => ({ ...s, chat: [...s.chat, { id: uid(), role: 'assistant', text: reply.text, verdict: reply.verdict, at: new Date().toISOString() }] }));
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const suggestions: { icon: IconName; tint: keyof typeof Tint; text: string; camera?: boolean }[] = [
    { icon: 'camera', tint: 'peach', text: `Snap a food: can ${dog.name} eat it?`, camera: true },
    { icon: 'bowl', tint: 'butter', text: `How much should ${dog.name} eat a day?` },
    { icon: 'potty', tint: 'mint', text: `How often should ${dog.name} pee and poo?` },
    { icon: 'medal', tint: 'lavender', text: 'How do I stop puppy biting?' },
    { icon: 'bone', tint: 'sky', text: `Can ${dog.name} eat grapes?` },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headAvatar}>
          <Mascot size={46} />
        </View>
        <View style={{ flex: 1 }}>
          <T v="h2">Ask Pawgress</T>
          <Pressable onPress={() => router.push('/ai')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Change AI connection">
            <Row gap={6}>
              <View style={[styles.dot, { backgroundColor: provider.id === 'demo' ? C.butterDeep : C.ok }]} />
              <T v="small" numberOfLines={1} style={{ flexShrink: 1 }}>
                {provider.label}
              </T>
              <T v="small" style={{ color: C.lavenderDeep, fontFamily: F.bodyHeavy }}>
                Change
              </T>
            </Row>
          </Pressable>
        </View>
        {state.chat.length > 0 && (
          <Pressable onPress={() => update((s) => ({ ...s, chat: [] }))} accessibilityRole="button" accessibilityLabel="Start a new chat" style={styles.newChat}>
            <Icon name="plus" size={16} color={C.ink} strokeWidth={2.6} />
            <T v="bodyStrong" style={{ fontSize: 13 }}>
              New chat
            </T>
          </Pressable>
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView ref={scroller} contentContainerStyle={{ padding: 18, gap: 12, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          {state.chat.length === 0 && (
            <Animated.View entering={FadeInDown} style={{ gap: 14 }}>
              <View style={styles.intro}>
                <Mascot size={110} />
                <T v="h1" style={{ textAlign: 'center' }}>
                  Ask anything about {dog.name}
                </T>
                <T style={{ textAlign: 'center', color: C.inkSoft }}>
                  Take a photo of a food, a poop, a rash or a toy and ask. Answers are tailored to {dog.name}'s age, size and allergies.
                </T>
              </View>
              {suggestions.map((s, i) => (
                <Animated.View key={s.text} entering={FadeInDown.delay(100 + i * 60)}>
                  <Press onPress={() => (s.camera ? pick(true) : send(s.text))}>
                    <View style={styles.suggestion}>
                      <View style={[styles.sIcon, { backgroundColor: Tint[s.tint][0] }]}>
                        <Icon name={s.icon} size={18} color={Tint[s.tint][1]} />
                      </View>
                      <T v="bodyStrong" style={{ flex: 1 }}>
                        {s.text}
                      </T>
                      <Icon name="chevron" size={18} color={C.inkFaint} />
                    </View>
                  </Press>
                </Animated.View>
              ))}
              {provider.id === 'demo' && (
                <Press onPress={() => router.push('/ai')}>
                  <View style={[styles.demoNote]}>
                    <Icon name="spark" size={18} color={C.lavenderDeep} />
                    <T v="small" style={{ flex: 1, color: C.ink }}>
                      Demo mode answers from built-in guides and can't read photos. Tap here to connect your own Claude account for photo answers and open questions.
                    </T>
                  </View>
                </Press>
              )}
            </Animated.View>
          )}

          {state.chat.map((m) =>
            m.role === 'user' ? (
              <Animated.View key={m.id} entering={FadeInUp.duration(250)} style={{ alignSelf: 'flex-end', maxWidth: '82%', gap: 6, alignItems: 'flex-end' }}>
                {m.imageUri ? <Image source={{ uri: m.imageUri }} style={styles.photo} contentFit="cover" /> : null}
                <View style={styles.userBubble}>
                  <T style={{ color: '#fff', fontFamily: F.bodySemi }}>{m.text}</T>
                </View>
              </Animated.View>
            ) : (
              <Animated.View key={m.id} entering={FadeInDown.duration(300)} style={{ alignSelf: 'flex-start', maxWidth: '90%', gap: 6 }}>
                <View style={styles.botBubble}>
                  {m.verdict && (
                    <View style={[styles.verdict, { backgroundColor: Tint[VERDICT[m.verdict].tint][0] }]}>
                      <Icon name={VERDICT[m.verdict].icon} size={14} color={Tint[VERDICT[m.verdict].tint][1]} strokeWidth={3} />
                      <T v="bodyStrong" style={{ fontSize: 13 }}>
                        {VERDICT[m.verdict].label}
                      </T>
                    </View>
                  )}
                  <T>{m.text}</T>
                </View>
              </Animated.View>
            ),
          )}
          {busy && <TypingDots />}
          {error ? (
            <View style={styles.error}>
              <T v="small" style={{ color: C.danger }}>
                {error}
              </T>
            </View>
          ) : null}
          {state.chat.length > 0 && !busy && (
            <T v="small" style={{ textAlign: 'center', marginTop: 6 }}>
              Pawgress is not a vet. In an emergency, call your vet right away.
            </T>
          )}
        </ScrollView>

        <View style={[styles.inputWrap, { paddingBottom: keyboard ? 10 : tabSpace + 34 }]}>
          {attachment && (
            <View style={styles.attachRow}>
              <Image source={{ uri: attachment.uri }} style={styles.thumb} contentFit="cover" />
              <T v="small" style={{ flex: 1 }}>
                Photo attached
              </T>
              <Pressable onPress={() => setAttachment(null)} hitSlop={10} accessibilityLabel="Remove photo">
                <Icon name="close" size={18} color={C.inkSoft} />
              </Pressable>
            </View>
          )}
          <View style={styles.inputBar}>
            <Pressable onPress={() => pick(true)} style={[styles.inBtn, { backgroundColor: C.peachDeep }]} accessibilityLabel="Take a photo">
              <Icon name="camera" size={19} color="#fff" />
            </Pressable>
            <Pressable onPress={() => pick(false)} style={[styles.inBtn, { backgroundColor: C.lavender }]} accessibilityLabel="Attach a photo">
              <Icon name="image" size={19} color={C.lavenderDeep} />
            </Pressable>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={`Ask about ${dog.name}…`}
              placeholderTextColor={C.inkFaint}
              style={styles.input}
              multiline
              onSubmitEditing={() => send()}
              submitBehavior="submit"
              returnKeyType="send"
            />
            <Pressable onPress={() => send()} disabled={busy || (!text.trim() && !attachment)} style={[styles.inBtn, { backgroundColor: C.pill, opacity: busy || (!text.trim() && !attachment) ? 0.35 : 1 }]} accessibilityLabel="Send">
              <Icon name="send" size={18} color="#fff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 8 },
  headAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.lavender, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  newChat: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 36, paddingHorizontal: 12, borderRadius: R.pill, backgroundColor: C.paper, borderWidth: 1.5, borderColor: C.line },
  intro: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  suggestion: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.paper, borderRadius: R.lg, padding: 12, ...shadow },
  sIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  demoNote: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: C.lavender, borderRadius: R.md, padding: 12 },
  userBubble: { backgroundColor: C.lavenderDeep, borderRadius: 22, borderBottomRightRadius: 6, paddingHorizontal: 16, paddingVertical: 10 },
  botBubble: { backgroundColor: C.paper, borderRadius: 22, borderBottomLeftRadius: 6, paddingHorizontal: 16, paddingVertical: 12, gap: 8, alignSelf: 'flex-start', ...shadow },
  verdict: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 4 },
  photo: { width: 200, height: 160, borderRadius: 20, borderWidth: 3, borderColor: '#fff' },
  error: { backgroundColor: C.dangerSoft, borderRadius: R.md, padding: 12 },
  inputWrap: { paddingHorizontal: 14, paddingTop: 8, gap: 8, backgroundColor: C.bg },
  attachRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.paper, borderRadius: R.md, padding: 8 },
  thumb: { width: 40, height: 40, borderRadius: 10 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, backgroundColor: C.paper, borderRadius: 28, padding: 6, ...shadow },
  inBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minHeight: 42, maxHeight: 110, fontFamily: F.bodySemi, fontSize: 15, color: C.ink, paddingHorizontal: 6, paddingTop: 11, paddingBottom: 10, textAlignVertical: 'center' },
});
