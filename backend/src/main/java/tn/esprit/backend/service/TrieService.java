// TrieService.java
package tn.esprit.backend.service;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class TrieService {

    private final TrieNode root = new TrieNode();

    // Domain corpus — pregnancy, baby, women's health
    private static final List<String> CORPUS = List.of(
            "pregnancy", "pregnant", "prenatal", "postnatal", "postpartum",
            "trimester", "first trimester", "second trimester", "third trimester",
            "contractions", "labor", "delivery", "cesarean", "epidural",
            "midwife", "obstetrician", "gynecologist", "ultrasound", "heartbeat",
            "fetus", "embryo", "baby", "newborn", "breastfeeding", "lactation",
            "morning sickness", "nausea", "cravings", "weight gain",
            "fertility", "ovulation", "menstrual cycle", "period", "hormones",
            "estrogen", "progesterone", "follicle", "implantation", "IVF",
            "miscarriage", "stillbirth", "premature", "gestational diabetes",
            "preeclampsia", "anemia", "iron supplements", "folic acid",
            "vitamin D", "prenatal vitamins", "nutrition", "healthy eating",
            "exercise", "yoga", "meditation", "mental health", "anxiety",
            "depression", "baby blues", "bonding", "attachment", "skin to skin",
            "swaddle", "colic", "latching", "milk supply", "pumping",
            "formula", "weaning", "solid foods", "sleep schedule", "nap",
            "pediatrician", "vaccination", "milestone", "development",
            "community", "support group", "marraine", "sisterhood",
            "self care", "recovery", "healing", "empowerment", "strength",
            "love", "motherhood", "parenthood", "family", "joy", "journey",
            "week", "months", "due date", "birth plan", "hospital bag",
            "contractions timer", "kick count", "belly", "bump", "glow"
    );

    @PostConstruct
    public void init() {
        CORPUS.forEach(this::insert);
    }

    public void insert(String word) {
        TrieNode node = root;
        for (char c : word.toLowerCase().toCharArray()) {
            node.children.putIfAbsent(c, new TrieNode());
            node = node.children.get(c);
        }
        node.isEnd = true;
        node.frequency++;
    }

    public List<String> suggest(String prefix, int limit) {
        if (prefix == null || prefix.isBlank()) return List.of();
        TrieNode node = root;
        for (char c : prefix.toLowerCase().toCharArray()) {
            if (!node.children.containsKey(c)) return List.of();
            node = node.children.get(c);
        }
        List<String[]> results = new ArrayList<>();
        collectWords(node, new StringBuilder(prefix.toLowerCase()), results);
        return results.stream()
                .sorted((a, b) -> Integer.compare(Integer.parseInt(b[1]), Integer.parseInt(a[1])))
                .limit(limit)
                .map(r -> r[0])
                .toList();
    }

    private void collectWords(TrieNode node, StringBuilder current, List<String[]> results) {
        if (node.isEnd) results.add(new String[]{current.toString(), String.valueOf(node.frequency)});
        for (Map.Entry<Character, TrieNode> e : node.children.entrySet()) {
            current.append(e.getKey());
            collectWords(e.getValue(), current, results);
            current.deleteCharAt(current.length() - 1);
        }
    }
}