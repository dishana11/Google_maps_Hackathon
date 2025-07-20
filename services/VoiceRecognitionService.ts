import { Platform } from 'react-native';
import { StorageService } from './StorageService';

export class VoiceRecognitionService {
  private static isListening = false;
  private static recognitionCallback: ((text: string) => void) | null = null;
  private static shouldRestart = true;

  static async startListening(callback: (text: string) => void): Promise<boolean> {
    if (Platform.OS === 'web') {
      return this.startWebSpeechRecognition(callback);
    }

    // For mobile platforms, we would use expo-speech or react-native-voice
    console.log('Voice recognition not implemented for mobile platforms yet');
    return false;
  }

  private static startWebSpeechRecognition(callback: (text: string) => void): boolean {
    try {
      // Check if Web Speech API is available
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.log('Web Speech API not supported');
        return false;
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        this.isListening = true;
        this.shouldRestart = true;
        console.log('Voice recognition started');
      };

      recognition.onresult = async (event: any) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }

        if (finalTranscript) {
          console.log('Voice recognition result:', finalTranscript);
          
          // Check if it matches emergency trigger
          const isEmergencyTrigger = await this.checkEmergencyTrigger(finalTranscript);
          if (isEmergencyTrigger) {
            callback(finalTranscript);
          }
        }
      };

      recognition.onerror = (event: any) => {
        // Handle specific error types differently
        if (event.error === 'not-allowed') {
          console.warn('Microphone access denied. Voice recognition will not restart.');
          this.isListening = false;
          this.recognitionCallback = null;
          this.shouldRestart = false;
          return;
        }
        
        if (event.error === 'no-speech') {
          // This is a normal occurrence - don't log as error
          console.log('No speech detected, continuing to listen...');
          return;
        }
        
        // Log other errors normally
        console.error('Voice recognition error:', event.error);
        this.isListening = false;
      };

      recognition.onend = () => {
        this.isListening = false;
        console.log('Voice recognition ended');
        
        // Only restart if we're still supposed to be listening and restart is allowed
        if (this.recognitionCallback && this.shouldRestart) {
          setTimeout(() => {
            if (this.recognitionCallback && this.shouldRestart) {
              this.startWebSpeechRecognition(this.recognitionCallback);
            }
          }, 1000);
        }
      };

      recognition.start();
      this.recognitionCallback = callback;
      return true;

    } catch (error) {
      console.error('Error starting web speech recognition:', error);
      return false;
    }
  }

  static stopListening(): void {
    this.isListening = false;
    this.recognitionCallback = null;
    this.shouldRestart = false;
    
    if (Platform.OS === 'web') {
      // Stop web speech recognition
      // The recognition will stop automatically when recognitionCallback is null
    }
  }

  private static async checkEmergencyTrigger(text: string): Promise<boolean> {
    try {
      const settings = await StorageService.getUserSettings();
      const triggerPhrase = settings.voiceCommand.toLowerCase();
      const spokenText = text.toLowerCase();
      
      return spokenText.includes(triggerPhrase);
    } catch (error) {
      console.error('Error checking emergency trigger:', error);
      return false;
    }
  }

  static isCurrentlyListening(): boolean {
    return this.isListening;
  }
}
