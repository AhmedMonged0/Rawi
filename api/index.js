    });

if (!response.ok) {
  const errData = await response.json();
  console.error("Gemini Backend Error:", errData);
  return res.status(response.status).json({ message: "فشل الاتصال بالذكاء الاصطناعي" });
}

const data = await response.json();
const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "عذراً، لم أستطع فهم ذلك.";
res.json({ reply });

  } catch (error) {
  console.error("Chat Server Error:", error);
  res.status(500).json({ message: "حدث خطأ في الخادم" });
}
});

export default app;