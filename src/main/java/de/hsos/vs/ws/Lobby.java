package de.hsos.vs.ws;

import java.io.IOException;
import javax.json.Json;
import javax.json.JsonObject;
import javax.websocket.Session;

class Lobby {

    private Session p1;
    private Session p2;

    Lobby(Session session) {
        p1 = session;
    }

    public boolean canJoin() {
        return p2 == null;
    }

    public void join(Session session) {
        p2 = session;
        p1.getAsyncRemote().sendText(buildJoinRequest());
    }

    private String buildJoinRequest() {
        JsonObject obj = Json.createObjectBuilder()
                .add("action", "join-request")
                .add("profile", "name etc.").build();
        return obj.toString();
    }

    public void signal(Session sender, String text) {
        if (p1 == sender && p2 != null) {
            p2.getAsyncRemote().sendText(text);
        } else if (p2 == sender && p1 != null) {
            p1.getAsyncRemote().sendText(text);
        }
    }

    public boolean quit(Session session) throws IOException {

        if (session != p1 && session != p2) {
            return false;
        }

        if (p1 != null && p1.isOpen()) {
            p1.close();
        }
        if (p2 != null && p2.isOpen()) {
            p2.close();
        }
        return true;

    }

}
