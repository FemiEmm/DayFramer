import { ref, onMounted, onUnmounted, computed } from 'vue'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { signIn, signUp, signOut } from './api'

const sessionRef = ref<Session | null>(null)
const userRef = computed<User | null>(() => sessionRef.value?.user ?? null)

let unsub: (() => void) | null = null

export function useAuth() {
  const loading = ref(true)
  const errorMsg = ref<string | null>(null)

  const init = async () => {
    const { data } = await supabase.auth.getSession()
    sessionRef.value = data.session ?? null
    loading.value = false

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      sessionRef.value = session ?? null
    })
    unsub = () => sub.subscription.unsubscribe()
  }

  const doSignUp = async (email: string, password: string) => {
    errorMsg.value = null
    try {
      await signUp(email, password)
      // if Confirm Email is ON, tell the user to check inbox
    } catch (e: any) {
      errorMsg.value = e.message
    }
  }

  const doSignIn = async (email: string, password: string) => {
    errorMsg.value = null
    try {
      await signIn(email, password)
    } catch (e: any) {
      errorMsg.value = e.message
    }
  }

  const doSignOut = async () => {
    await signOut()
  }

  onMounted(init)
  onUnmounted(() => unsub?.())

  return {
    loading,
    errorMsg,
    session: sessionRef,
    user: userRef,
    doSignUp,
    doSignIn,
    doSignOut
  }
}
