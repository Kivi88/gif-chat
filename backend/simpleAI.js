const rules = {
  spam: {
    keywords: ['spam', 'reklam', 'tikla', 'para kazan', 'hediye'],
    severity: 'yüksek',
    template: 'Platformumuzda spam içerik paylaşımı tespit edilmiştir.'
  },
  harassment: {
    keywords: ['taciz', 'hakaret', 'küfür', 'tehdit'],
    severity: 'çok yüksek',
    template: 'Kullanıcılara yönelik taciz/hakaret içeren davranış tespit edilmiştir.'
  },
  inappropriate: {
    keywords: ['uygunsuz', 'rahatsız edici', '18+'],
    severity: 'yüksek',
    template: 'Platformumuza uygun olmayan içerik paylaşımı tespit edilmiştir.'
  },
  scam: {
    keywords: ['dolandırıcılık', 'sahte', 'phishing', 'link'],
    severity: 'çok yüksek',
    template: 'Dolandırıcılık/sahte içerik paylaşımı tespit edilmiştir.'
  }
}

export function generateWarningMessage(reason, customDetails = '') {
  let matchedRule = null
  let matchedKeyword = ''

  for (const [ruleType, rule] of Object.entries(rules)) {
    for (const keyword of rule.keywords) {
      if (reason.toLowerCase().includes(keyword)) {
        matchedRule = rule
        matchedKeyword = keyword
        break
      }
    }
    if (matchedRule) break
  }

  if (!matchedRule) {
    matchedRule = {
      severity: 'orta',
      template: 'Platform kurallarına aykırı davranış tespit edilmiştir.'
    }
  }

  const warningLevels = {
    'orta': {
      title: '⚠️ UYARI',
      action: 'Bu uyarı kaydedilmiştir.'
    },
    'yüksek': {
      title: '🚨 CİDDİ UYARI',
      action: 'Tekrarı durumunda hesabınız askıya alınabilir.'
    },
    'çok yüksek': {
      title: '🔴 SON UYARI',
      action: 'Bir daha tekrarı durumunda hesabınız kalıcı olarak kapatılacaktır.'
    }
  }

  const level = warningLevels[matchedRule.severity]

  const message = `
${level.title}

${matchedRule.template}

Tespit Edilen Sorun: ${reason}
${customDetails ? `\nDetaylar: ${customDetails}` : ''}

${level.action}

Lütfen platform kurallarımıza uygun davranmaya özen gösteriniz.

GIF Chat Moderasyon Ekibi
`.trim()

  return {
    message,
    severity: matchedRule.severity,
    detectedKeyword: matchedKeyword || 'genel kural ihlali'
  }
}

export function analyzeReportSeverity(reportReason) {
  for (const [ruleType, rule] of Object.entries(rules)) {
    for (const keyword of rule.keywords) {
      if (reportReason.toLowerCase().includes(keyword)) {
        return {
          severity: rule.severity,
          category: ruleType,
          autoFlag: rule.severity === 'çok yüksek'
        }
      }
    }
  }

  return {
    severity: 'düşük',
    category: 'diğer',
    autoFlag: false
  }
}
