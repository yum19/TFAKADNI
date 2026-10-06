// TrieNode.java
package tn.esprit.backend.service;

import java.util.HashMap;
import java.util.Map;

public class TrieNode {
    Map<Character, TrieNode> children = new HashMap<>();
    boolean isEnd = false;
    int frequency = 1;
}