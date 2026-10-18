# -*- coding: utf-8 -*-
"""Sources VBA de l'outil de scoring PF V8, version 3 (encodage cp1252 : pas de symbole hors Windows-1252).

Les adresses entre accolades ({P_FIRST}, {CK_FIRST}...) sont remplacées à la construction
par celles de la mise en page du dossier (build_tool.R).
"""

MOD_OUTIL = r'''Option Explicit

' =====================================================================
'  Outil de scoring Project Finance V8 - version 3 - macros de pilotage
'  Toutes les notes sont calculees par les FORMULES des onglets : les
'  macros creent, dupliquent, controlent, preparent l'echeancier,
'  exportent et tracent. Les feuilles sont protegees SANS mot de passe.
' =====================================================================

Public Const MARQUEUR As String = "DOSSIER_V8"
Public Const MARQUEUR_MODELE As String = "MODELE"
Public Const ONGLET_MODELE As String = "Modèle"
Public Const ONGLET_SYNTHESE As String = "Synthèse"
Public Const ONGLET_FICHE As String = "Fiche comité"
Public Const ONGLET_JOURNAL As String = "Journal"
Public Const ONGLET_ACCUEIL As String = "Accueil"
Public Const ONGLET_PARAM As String = "Paramètres"
Public Const ONGLET_DIAG As String = "Diagnostic"
Public Const ONGLET_COMPARAISON As String = "Comparaison"
Public Const ONGLET_CONCORDANCE As String = "Concordance"
Public Const ONGLET_REFERENTIEL As String = "Référentiel des niveaux"
Public Const ONGLET_REVUE As String = "Revue IA"
Public Const ONGLET_CHAMPS As String = "Champs IA"
Public Const CELLULE_CODE_CLIENT As String = "B{CODE_CLIENT}"
Public Const CELLULE_RADICAL As String = "B{RADICAL}"
Public Const CELLULE_CODE_PROJET As String = "B{CODE_PROJET}"

Private Const LIGNE_P1 As Long = {P_FIRST}
Private Const LIGNE_PN As Long = {P_LAST}
Private Const CK_PREMIERE As Long = {CK_FIRST}
Private Const CK_DERNIERE As Long = {CK_LAST}
Private Const MAX_DOSSIERS As Long = {MAX_DOSSIERS}
Private Const MAX_LIGNES_MSG As Long = 12

' ---------------------------------------------------------------------
'  Utilitaires
' ---------------------------------------------------------------------
' Texte d'une valeur de cellule, sans erreur d'execution sur #N/A, #DIV/0!...
Public Function Txt(ByVal v As Variant) As String
    If IsError(v) Then
        Txt = "#ERREUR"
    ElseIf IsEmpty(v) Then
        Txt = ""
    Else
        Txt = Trim$(CStr(v))
    End If
End Function

Private Function EstNombre(ByVal v As Variant) As Boolean
    If IsError(v) Or IsEmpty(v) Then Exit Function
    Select Case VarType(v)
        Case vbDouble, vbSingle, vbInteger, vbLong, vbCurrency, vbDecimal
            EstNombre = True
    End Select
End Function

' Protection sans mot de passe. UserInterfaceOnly laisse les macros ecrire
' tout en empechant l'utilisateur d'ecraser une formule.
Public Sub Proteger(ByVal ws As Worksheet)
    On Error Resume Next
    ws.Protect Password:="", DrawingObjects:=True, Contents:=True, Scenarios:=True, _
               UserInterfaceOnly:=True, AllowFormattingColumns:=True, AllowFormattingRows:=True, _
               AllowSorting:=True, AllowFiltering:=True
End Sub

Public Sub ProtegerTout()
    Dim ws As Worksheet
    For Each ws In ThisWorkbook.Worksheets
        Proteger ws
    Next ws
End Sub

Private Sub Activer(ByVal nom As String)
    On Error GoTo Absent
    ThisWorkbook.Worksheets(nom).Activate
    Exit Sub
Absent:
    MsgBox "Onglet « " & nom & " » introuvable.", vbExclamation
End Sub

' ---------------------------------------------------------------------
'  Navigation
' ---------------------------------------------------------------------
Public Sub AllerAccueil()
    Activer ONGLET_ACCUEIL
End Sub

Public Sub AllerSynthese()
    MajSynthese False
    Activer ONGLET_SYNTHESE
End Sub

Public Sub AllerParametres()
    Activer ONGLET_PARAM
End Sub

Public Sub AllerDiagnostic()
    Activer ONGLET_DIAG
End Sub

Public Sub AllerJournal()
    Activer ONGLET_JOURNAL
End Sub

Public Sub AllerConcordance()
    Application.Calculate
    Activer ONGLET_CONCORDANCE
End Sub

Public Sub AllerReferentiel()
    Activer ONGLET_REFERENTIEL
End Sub

' ---------------------------------------------------------------------
'  Reconnaissance d'un onglet dossier
' ---------------------------------------------------------------------
' Un dossier porte DOSSIER_V8 en J1 (colonne masquee). Une copie faite a la
' main depuis le Modele (MODELE en J1) est aussi reconnue.
Public Function EstDossier(ByVal ws As Object) As Boolean
    Dim m As String
    On Error GoTo Non
    If TypeName(ws) <> "Worksheet" Then Exit Function
    m = Txt(ws.Range("J1").Value)
    If m = MARQUEUR Then
        EstDossier = True
    ElseIf m = MARQUEUR_MODELE And ws.Name <> ONGLET_MODELE Then
        EstDossier = True
    End If
    Exit Function
Non:
    EstDossier = False
End Function

Public Function FeuilleExiste(ByVal nom As String) As Boolean
    Dim ws As Worksheet
    For Each ws In ThisWorkbook.Worksheets
        If StrComp(ws.Name, nom, vbTextCompare) = 0 Then
            FeuilleExiste = True
            Exit Function
        End If
    Next ws
End Function

Public Function ListeDossiers() As String
    Dim ws As Worksheet, s As String
    For Each ws In ThisWorkbook.Worksheets
        If EstDossier(ws) Then
            If s <> "" Then s = s & ", "
            s = s & ws.Name
        End If
    Next ws
    ListeDossiers = "Dossiers existants : " & s
End Function

Public Function NomValide(ByVal nom As String) As Boolean
    Dim interdit As Variant, c As Variant
    NomValide = False
    If Len(nom) = 0 Or Len(nom) > 31 Then
        MsgBox "Le nom doit compter de 1 à 31 caractères.", vbExclamation
        Exit Function
    End If
    interdit = Array(":", "\", "/", "?", "*", "[", "]", "'")
    For Each c In interdit
        If InStr(nom, c) > 0 Then
            MsgBox "Le nom ne peut pas contenir : \ / ? * [ ] ' ou :", vbExclamation
            Exit Function
        End If
    Next c
    If FeuilleExiste(nom) Then
        MsgBox "Un onglet porte déjà le nom « " & nom & " ».", vbExclamation
        Exit Function
    End If
    NomValide = True
End Function

' Dossier vise par une action : l'onglet actif s'il s'agit d'un dossier, sinon
' le nom demande a l'utilisateur. Renvoie Nothing si l'action est abandonnee.
Public Function DossierCible(ByVal titre As String) As Worksheet
    Dim nom As String
    If EstDossier(ActiveSheet) Then
        Set DossierCible = ActiveSheet
        Exit Function
    End If
    nom = Trim$(InputBox("Nom de l'onglet du dossier :" & vbCrLf & vbCrLf & ListeDossiers(), titre))
    If nom = "" Then Exit Function
    If Not FeuilleExiste(nom) Then
        MsgBox "Aucun onglet ne porte le nom « " & nom & " ».", vbExclamation, titre
        Exit Function
    End If
    If Not EstDossier(ThisWorkbook.Worksheets(nom)) Then
        MsgBox "« " & nom & " » n'est pas un onglet de dossier.", vbExclamation, titre
        Exit Function
    End If
    Set DossierCible = ThisWorkbook.Worksheets(nom)
End Function

Private Function DossierActif(ByVal titre As String) As Worksheet
    If EstDossier(ActiveSheet) Then
        Set DossierActif = ActiveSheet
    Else
        MsgBox "Placez-vous d'abord sur l'onglet d'un dossier.", vbExclamation, titre
    End If
End Function

' ---------------------------------------------------------------------
'  Creation, duplication, suppression
' ---------------------------------------------------------------------
Public Sub NouveauDossier()
    Dim nom As String, intitule As String, wsN As Worksheet
    nom = Trim$(InputBox("Nom court du nouvel onglet (ex. C6 ou PORT-NADOR) :", "Nouveau dossier (1/2)"))
    If nom = "" Then Exit Sub
    If Not NomValide(nom) Then Exit Sub
    intitule = Trim$(InputBox("Intitulé du projet (facultatif, modifiable ensuite en A1) :", "Nouveau dossier (2/2)"))
    Set wsN = CreerDossier(nom, intitule)
    If wsN Is Nothing Then Exit Sub
    Application.Goto wsN.Range(CELLULE_CODE_CLIENT), True
    MsgBox "Dossier « " & nom & " » créé." & vbCrLf & vbCrLf & _
           "1. Saisissez les codes : client T24, radical (7 chiffres), code projet (PF-AAAA-NNNN)." & vbCrLf & _
           "2. Remplissez les cellules ORANGE (saisies obligatoires), de haut en bas." & vbCrLf & _
           "3. La ligne « À SAISIR » en haut indique la prochaine saisie et donne un lien pour y aller." & vbCrLf & _
           "4. Sélectionnez une cellule pour afficher son aide.", vbInformation, "Nouveau dossier"
End Sub

' Copie du modele vierge, renommee ; renvoie Nothing en cas d'echec.
Public Function CreerDossier(ByVal nom As String, ByVal intitule As String) As Worksheet
    Dim wsM As Worksheet, wsN As Worksheet, etat As Long
    On Error GoTo Echec
    Application.ScreenUpdating = False
    Set wsM = ThisWorkbook.Worksheets(ONGLET_MODELE)
    etat = wsM.Visible
    wsM.Visible = xlSheetVisible
    wsM.Copy Before:=wsM
    Set wsN = ActiveSheet
    wsM.Visible = etat
    wsN.Name = nom
    If wsN.Name <> nom Then Err.Raise 1004, , "le nom « " & nom & " » est refusé"
    Proteger wsN
    wsN.Range("J1").Value = MARQUEUR
    If intitule <> "" Then
        wsN.Range("A1").Value = intitule
    Else
        wsN.Range("A1").Value = "Nouveau dossier " & nom
    End If
    Application.ScreenUpdating = True
    MajSynthese False
    Journaliser "Création", nom, "Dossier créé à partir du modèle vierge"
    wsN.Activate
    Set CreerDossier = wsN
    Exit Function
Echec:
    Dim msg As String
    msg = Err.Description
    On Error Resume Next
    If Not wsM Is Nothing Then wsM.Visible = xlSheetHidden
    ' copie orpheline du modele : supprimee
    If Not wsN Is Nothing Then
        Application.DisplayAlerts = False
        wsN.Delete
        Application.DisplayAlerts = True
    End If
    Application.ScreenUpdating = True
    MsgBox "Création impossible : " & msg, vbExclamation, "Nouveau dossier"
End Function

Public Sub DupliquerDossier()
    Dim ws As Worksheet, nom As String, wsN As Worksheet
    Set ws = DossierCible("Dupliquer un dossier")
    If ws Is Nothing Then Exit Sub
    nom = Trim$(InputBox("Nom du nouvel onglet (copie de « " & ws.Name & " ») :", "Dupliquer un dossier", Left$(ws.Name, 28) & "-v2"))
    If nom = "" Then Exit Sub
    If Not NomValide(nom) Then Exit Sub

    On Error GoTo Echec
    Application.ScreenUpdating = False
    ws.Copy After:=ws
    Set wsN = ActiveSheet
    wsN.Name = nom
    Proteger wsN
    wsN.Range("J1").Value = MARQUEUR
    Application.ScreenUpdating = True
    MajSynthese False
    Journaliser "Duplication", nom, "Copie de " & ws.Name
    wsN.Activate
    MsgBox "Copie « " & nom & " » créée : modifiez-la pour tester une variante (montage, stress, couverture...).", _
           vbInformation, "Dupliquer un dossier"
    Exit Sub
Echec:
    Application.ScreenUpdating = True
    MsgBox "Duplication impossible : " & Err.Description, vbExclamation, "Dupliquer un dossier"
End Sub

Public Sub SupprimerDossier()
    Dim ws As Worksheet, nom As String
    Set ws = DossierCible("Supprimer un dossier")
    If ws Is Nothing Then Exit Sub
    nom = ws.Name
    If MsgBox("Supprimer définitivement le dossier « " & nom & " » ?" & vbCrLf & _
              "Cette action est irréversible.", vbYesNo + vbExclamation + vbDefaultButton2, "Supprimer un dossier") <> vbYes Then Exit Sub
    Application.DisplayAlerts = False
    ws.Delete
    Application.DisplayAlerts = True
    MajSynthese False
    Journaliser "Suppression", nom, ""
    Activer ONGLET_ACCUEIL
End Sub

' ---------------------------------------------------------------------
'  Synthese : la ligne 4 recoit le nom des onglets dossiers ; les formules
'  (INDIRECT) des lignes suivantes lisent chaque dossier.
' ---------------------------------------------------------------------
Public Sub MajSynthese(Optional ByVal avecMessage As Boolean = True)
    Dim wsS As Worksheet, ws As Worksheet, col As Long, nb As Long, trop As Long
    On Error GoTo Echec
    Set wsS = ThisWorkbook.Worksheets(ONGLET_SYNTHESE)
    Proteger wsS
    Application.ScreenUpdating = False
    wsS.Range(wsS.Cells(4, 2), wsS.Cells(4, 1 + MAX_DOSSIERS)).ClearContents
    col = 2
    For Each ws In ThisWorkbook.Worksheets
        If EstDossier(ws) Then
            If col <= 1 + MAX_DOSSIERS Then
                ' apostrophe : un nom comme 2026 ou VRAI reste du texte
                wsS.Cells(4, col).Value = "'" & ws.Name
                col = col + 1
            Else
                trop = trop + 1
            End If
        End If
    Next ws
    nb = col - 2
    Application.Calculate
    Application.ScreenUpdating = True
    If avecMessage Then
        If trop > 0 Then
            MsgBox nb & " dossier(s) dans la synthèse ; " & trop & " dossier(s) au-delà de " & MAX_DOSSIERS & _
                   " ne sont pas affichés.", vbExclamation, "Synthèse"
        Else
            MsgBox nb & " dossier(s) dans la synthèse.", vbInformation, "Synthèse"
        End If
    End If
    Exit Sub
Echec:
    Application.ScreenUpdating = True
    If avecMessage Then MsgBox "Mise à jour de la synthèse impossible : " & Err.Description, vbExclamation, "Synthèse"
End Sub

' Point d'entree des boutons : une macro liee a un bouton ne prend pas d'argument.
Public Sub MettreAJourSynthese()
    MajSynthese True
End Sub

Public Sub Recalculer()
    Application.CalculateFull
    MajSynthese False
    MsgBox "Recalcul terminé. La synthèse est à jour.", vbInformation, "Recalcul"
End Sub

' ---------------------------------------------------------------------
'  Controle de saisie : lit la check-list du dossier (colonnes P:R masquees),
'  la meme que celle de la ligne « A SAISIR ».
' ---------------------------------------------------------------------
Public Sub ControlerDossier()
    Dim ws As Worksheet, msg As String, attention As String, texte As String
    Dim r As Long, nb As Long, nbAtt As Long, premier As Range, adr As String, nr As Long
    Set ws = DossierActif("Contrôler la saisie")
    If ws Is Nothing Then Exit Sub
    Application.Calculate

    For r = CK_PREMIERE To CK_DERNIERE
        If Txt(ws.Cells(r, 18).Value) <> "1" Then
            nb = nb + 1
            adr = Txt(ws.Cells(r, 17).Value)
            If nb <= MAX_LIGNES_MSG Then msg = msg & "- " & Txt(ws.Cells(r, 16).Value) & "   (" & adr & ")" & vbCrLf
            If premier Is Nothing Then
                On Error Resume Next
                Set premier = ws.Range(adr)
                On Error GoTo 0
            End If
        End If
    Next r
    If nb > MAX_LIGNES_MSG Then msg = msg & "... et " & (nb - MAX_LIGNES_MSG) & " autre(s)." & vbCrLf

    For r = LIGNE_P1 To LIGNE_PN
        If EstNombre(ws.Cells(r, 2).Value) Then
            If ws.Cells(r, 2).Value < 0 Then
                nbAtt = nbAtt + 1
                If nbAtt <= 6 Then attention = attention & "- " & Txt(ws.Cells(r, 1).Value) & " : CFADS négatif (N1 noté Critique)." & vbCrLf
            End If
        End If
        If Txt(ws.Cells(r, 5).Value) = "Différé" Then
            nbAtt = nbAtt + 1
            If nbAtt <= 6 Then attention = attention & "- " & Txt(ws.Cells(r, 1).Value) & " : période de différé, exclue du DSCR." & vbCrLf
        End If
    Next r
    nr = Application.WorksheetFunction.CountIf(ws.Range("E{C_FIRST}:E{C_LAST}"), "n.r.")
    If nr > 0 Then attention = attention & "- " & nr & " plafond(s) non évalué(s) faute de donnée (section 11)." & vbCrLf

    If nb = 0 Then
        texte = "Toutes les saisies obligatoires sont faites." & vbCrLf & vbCrLf & _
                "Note approuvée : " & ws.Range("B6").Text & "   (" & ws.Range("D6").Text & ")" & vbCrLf & _
                "Statut : " & ws.Range("F6").Text & vbCrLf & _
                "Plafonds actifs : " & ws.Range("B8").Text
        If attention <> "" Then texte = texte & vbCrLf & vbCrLf & "Points d'attention :" & vbCrLf & attention
        texte = texte & vbCrLf & vbCrLf & "Étape suivante : bouton « Fiche comité »."
        MsgBox texte, vbInformation, "Contrôle du dossier " & ws.Name
    Else
        texte = nb & " saisie(s) obligatoire(s) manquante(s) :" & vbCrLf & vbCrLf & msg
        If attention <> "" Then texte = texte & vbCrLf & "Points d'attention :" & vbCrLf & attention
        texte = texte & vbCrLf & "Le curseur va sur la première cellule à remplir (en orange)."
        MsgBox texte, vbExclamation, "Contrôle du dossier " & ws.Name
        If Not premier Is Nothing Then Application.Goto premier
    End If
    Journaliser "Contrôle", ws.Name, IIf(nb = 0, "Complet", nb & " saisie(s) manquante(s)")
End Sub

' ---------------------------------------------------------------------
'  Echeancier : libelles des periodes, effacement
' ---------------------------------------------------------------------
Public Sub PreparerEcheancier()
    Dim ws As Worksheet, per As String, parAn As Long, suffixe As String
    Dim rep As String, nbAns As Long, n As Long, i As Long, defaut As Long, maxi As Long
    Set ws = DossierActif("Préparer l'échéancier")
    If ws Is Nothing Then Exit Sub

    per = Txt(ws.Range("B{PERIOD}").Value)
    If per = "" Then per = "Semestrielle"
    Select Case per
        Case "Trimestrielle"
            parAn = 4: suffixe = "T"
        Case "Mensuelle"
            parAn = 12: suffixe = "M"
        Case Else
            parAn = 2: suffixe = "S"
    End Select
    maxi = LIGNE_PN - LIGNE_P1 + 1

    defaut = 10
    If EstNombre(ws.Range("B{DUREE}").Value) Then
        If ws.Range("B{DUREE}").Value >= 1 Then defaut = CLng(ws.Range("B{DUREE}").Value)
    End If
    rep = Trim$(InputBox("Nombre d'années de remboursement :" & vbCrLf & vbCrLf & _
                         "Périodicité « " & per & " » : " & parAn & " échéance(s) par an, " & maxi & " périodes au plus.", _
                         "Préparer l'échéancier", CStr(defaut)))
    If rep = "" Then Exit Sub
    If Not IsNumeric(rep) Then
        MsgBox "Saisissez un nombre d'années.", vbExclamation, "Préparer l'échéancier"
        Exit Sub
    End If
    nbAns = CLng(rep)
    If nbAns < 1 Then
        MsgBox "Saisissez au moins une année.", vbExclamation, "Préparer l'échéancier"
        Exit Sub
    End If
    n = nbAns * parAn
    If n > maxi Then
        n = maxi
        MsgBox "L'échéancier compte au plus " & maxi & " périodes : seules les " & maxi & " premières sont préparées.", _
               vbInformation, "Préparer l'échéancier"
    End If
    If Application.WorksheetFunction.CountA(ws.Range("A" & LIGNE_P1 & ":C" & LIGNE_PN)) > 0 Then
        If MsgBox("L'échéancier contient déjà des saisies." & vbCrLf & _
                  "Remplacer les libellés de période ? Les montants saisis sont conservés.", _
                  vbYesNo + vbQuestion, "Préparer l'échéancier") <> vbYes Then Exit Sub
    End If

    Proteger ws
    Application.ScreenUpdating = False
    If Txt(ws.Range("B{PERIOD}").Value) = "" Then ws.Range("B{PERIOD}").Value = per
    ws.Range("A" & LIGNE_P1 & ":A" & LIGNE_PN).ClearContents
    For i = 0 To n - 1
        If suffixe = "M" Then
            ws.Cells(LIGNE_P1 + i, 1).Value = "An " & (i \ parAn + 1) & " · M" & Format((i Mod parAn) + 1, "00")
        Else
            ws.Cells(LIGNE_P1 + i, 1).Value = "An " & (i \ parAn + 1) & " · " & suffixe & ((i Mod parAn) + 1)
        End If
    Next i
    Application.ScreenUpdating = True
    Application.Goto ws.Range("B" & LIGNE_P1), True
    Journaliser "Échéancier préparé", ws.Name, n & " périodes (" & per & ")"
    MsgBox n & " périodes préparées." & vbCrLf & vbCrLf & _
           "Saisissez pour chacune le CFADS central (colonne B) et le service de la dette (colonne C). " & _
           "Le CFADS stressé (colonne F) est facultatif.", vbInformation, "Préparer l'échéancier"
End Sub

Public Sub EffacerEcheancier()
    Dim ws As Worksheet
    Set ws = DossierActif("Effacer l'échéancier")
    If ws Is Nothing Then Exit Sub
    If MsgBox("Effacer toutes les périodes de l'échéancier de « " & ws.Name & " » ?" & vbCrLf & _
              "(libellés, CFADS central, service de la dette, CFADS stressé)", _
              vbYesNo + vbExclamation + vbDefaultButton2, "Effacer l'échéancier") <> vbYes Then Exit Sub
    Proteger ws
    ws.Range("A" & LIGNE_P1 & ":C" & LIGNE_PN).ClearContents
    ws.Range("F" & LIGNE_P1 & ":F" & LIGNE_PN).ClearContents
    Journaliser "Échéancier effacé", ws.Name, ""
    Application.Goto ws.Range("A" & LIGNE_P1), True
End Sub

' ---------------------------------------------------------------------
'  Comparaison de deux dossiers
' ---------------------------------------------------------------------
Public Sub ComparerDossiers()
    Dim wsC As Worksheet, a As String, b As String
    MajSynthese False
    If EstDossier(ActiveSheet) Then a = ActiveSheet.Name
    If a = "" Then
        a = Trim$(InputBox("Premier dossier (nom de l'onglet) :" & vbCrLf & vbCrLf & ListeDossiers(), "Comparer deux dossiers"))
        If a = "" Then Exit Sub
    End If
    b = Trim$(InputBox("Comparer « " & a & " » avec quel dossier ?" & vbCrLf & vbCrLf & ListeDossiers(), "Comparer deux dossiers"))
    If b = "" Then Exit Sub
    If Not FeuilleExiste(a) Or Not FeuilleExiste(b) Then
        MsgBox "Onglet introuvable. " & ListeDossiers(), vbExclamation, "Comparer deux dossiers"
        Exit Sub
    End If
    If Not EstDossier(ThisWorkbook.Worksheets(a)) Or Not EstDossier(ThisWorkbook.Worksheets(b)) Then
        MsgBox "Choisissez deux onglets de dossier. " & ListeDossiers(), vbExclamation, "Comparer deux dossiers"
        Exit Sub
    End If
    Set wsC = ThisWorkbook.Worksheets(ONGLET_COMPARAISON)
    Proteger wsC
    wsC.Range("B4").Value = "'" & a
    wsC.Range("C4").Value = "'" & b
    Application.Calculate
    wsC.Activate
    Journaliser "Comparaison", a, "Comparé avec " & b
End Sub

' ---------------------------------------------------------------------
'  Fiche comite
' ---------------------------------------------------------------------
Public Sub OuvrirFiche()
    Dim wsF As Worksheet, nom As String
    If EstDossier(ActiveSheet) Then nom = ActiveSheet.Name
    MajSynthese False
    Set wsF = ThisWorkbook.Worksheets(ONGLET_FICHE)
    If nom <> "" Then
        Proteger wsF
        wsF.Range("B4").Value = "'" & nom
        Application.Calculate
    End If
    wsF.Activate
    wsF.Range("B4").Select
End Sub

Public Sub AllerDossierFiche()
    Dim nom As String
    nom = Txt(ThisWorkbook.Worksheets(ONGLET_FICHE).Range("B4").Value)
    If nom = "" Or Not FeuilleExiste(nom) Then
        MsgBox "Choisissez d'abord un dossier dans la cellule B4.", vbExclamation, "Fiche comité"
        Exit Sub
    End If
    ThisWorkbook.Worksheets(nom).Activate
End Sub

' ---------------------------------------------------------------------
'  Export PDF de l'onglet actif (dossier, synthese ou fiche comite)
' ---------------------------------------------------------------------
Public Sub ExporterPDF()
    Dim ws As Worksheet, chemin As Variant, dossier As String, nomFichier As String, sujet As String
    Set ws = ActiveSheet
    If Not EstDossier(ws) And ws.Name <> ONGLET_SYNTHESE And ws.Name <> ONGLET_FICHE And ws.Name <> ONGLET_COMPARAISON Then
        MsgBox "Placez-vous sur un dossier, sur la fiche comité, la comparaison ou la synthèse.", vbExclamation, "Exporter en PDF"
        Exit Sub
    End If
    If ws.Name = ONGLET_FICHE Then
        sujet = "Fiche_comite_" & CodeProjetDe(Txt(ws.Range("B4").Value)) & Txt(ws.Range("B4").Value)
    ElseIf ws.Name = ONGLET_SYNTHESE Then
        sujet = "Synthese"
    ElseIf ws.Name = ONGLET_COMPARAISON Then
        sujet = "Comparaison_" & Txt(ws.Range("B4").Value) & "_" & Txt(ws.Range("C4").Value)
    Else
        sujet = "Dossier_" & CodeProjetDe(ws.Name) & ws.Name
    End If
    nomFichier = sujet & "_" & Format(Now, "yyyymmdd_hhnn") & ".pdf"
    ' Classeur ouvert depuis OneDrive ou SharePoint : son chemin est une adresse web.
    dossier = ThisWorkbook.Path
    If dossier = "" Or LCase$(Left$(dossier, 4)) = "http" Then dossier = CurDir$
    chemin = Application.GetSaveAsFilename(InitialFileName:=dossier & Application.PathSeparator & nomFichier, _
                                           FileFilter:="Fichier PDF (*.pdf), *.pdf", Title:="Exporter en PDF")
    If VarType(chemin) = vbBoolean Then Exit Sub
    On Error GoTo Echec
    ws.ExportAsFixedFormat Type:=xlTypePDF, Filename:=CStr(chemin), Quality:=xlQualityStandard, _
                           IncludeDocProperties:=True, IgnorePrintAreas:=False, OpenAfterPublish:=True
    Journaliser "Export PDF", ws.Name, CStr(chemin)
    Exit Sub
Echec:
    MsgBox "Export impossible : " & Err.Description & vbCrLf & _
           "Vérifiez que le fichier n'est pas déjà ouvert et que le dossier est accessible.", vbExclamation, "Exporter en PDF"
End Sub

' ---------------------------------------------------------------------
'  Journal des actions
' ---------------------------------------------------------------------
Public Sub Journaliser(ByVal action As String, ByVal dossier As String, ByVal detail As String)
    Dim wsJ As Worksheet, r As Long
    On Error GoTo Fin
    Set wsJ = ThisWorkbook.Worksheets(ONGLET_JOURNAL)
    Proteger wsJ
    r = 5 + Application.WorksheetFunction.CountA(wsJ.Range("A5:A" & wsJ.Rows.Count))
    wsJ.Cells(r, 1).Value = Now
    wsJ.Cells(r, 1).NumberFormat = "dd/mm/yyyy hh:mm"
    wsJ.Cells(r, 2).Value = Utilisateur()
    wsJ.Cells(r, 3).Value = action
    wsJ.Cells(r, 4).Value = "'" & dossier
    wsJ.Cells(r, 5).Value = "'" & Replace(CodeProjetDe(dossier), "_", "")
    wsJ.Cells(r, 6).Value = "'" & detail
Fin:
End Sub

Private Function Utilisateur() As String
    On Error Resume Next
    Utilisateur = Application.UserName
    If Utilisateur = "" Then Utilisateur = Environ$("USERNAME")
End Function

' Code projet d'un dossier suivi de « _ » (vide si l'onglet n'existe pas ou n'a pas de code).
Public Function CodeProjetDe(ByVal nom As String) As String
    Dim c As String
    On Error GoTo Fin
    If nom = "" Then Exit Function
    If Not FeuilleExiste(nom) Then Exit Function
    If Not EstDossier(ThisWorkbook.Worksheets(nom)) Then Exit Function
    c = Txt(ThisWorkbook.Worksheets(nom).Range(CELLULE_CODE_PROJET).Value)
    If c <> "" Then CodeProjetDe = c & "_"
Fin:
End Function

' Changement de secteur : les donnees du bloc 4 se rapportent au secteur precedent.
Public Sub SecteurModifie(ByVal ws As Worksheet)
    On Error GoTo Fin
    If Application.WorksheetFunction.CountA(ws.Range("B{SEC_FIRST}:B{SEC_LAST}")) = 0 Then Exit Sub
    If MsgBox("Le secteur a changé : les données sectorielles du bloc 4 se rapportent au secteur précédent." & vbCrLf & _
              "Les effacer ?" & vbCrLf & vbCrLf & _
              "Rappel : choisissez de nouveau les situations de D2.1, D4.1, D4.3 et D5.2, dont la description dépend du secteur.", _
              vbYesNo + vbQuestion, "Changement de secteur") <> vbYes Then Exit Sub
    Application.EnableEvents = False
    Proteger ws
    ws.Range("B{SEC_FIRST}:B{SEC_LAST}").ClearContents
    ws.Range("D{SEC_FIRST}:H{SEC_LAST}").ClearContents
    Journaliser "Données sectorielles effacées", ws.Name, "Secteur : " & Txt(ws.Range("B{SECTEUR}").Value)
Fin:
    Application.EnableEvents = True
End Sub
'''

THIS_WORKBOOK = r'''Option Explicit

Private Sub Workbook_Open()
    On Error Resume Next
    modOutil.ProtegerTout
    Application.Calculate
    modOutil.MajSynthese False
    Me.Worksheets(modOutil.ONGLET_ACCUEIL).Activate
End Sub

' Trace des changements de routage : ils modifient les seuils et les poids.
Private Sub Workbook_SheetChange(ByVal Sh As Object, ByVal Target As Range)
    On Error GoTo Fin
    If Not modOutil.EstDossier(Sh) Then Exit Sub
    If Not Intersect(Target, Sh.Range("B{REGIME}:B{PHASE}")) Is Nothing Then
        modOutil.Journaliser "Routage modifié", Sh.Name, _
            modOutil.Txt(Sh.Range("B{REGIME}").Value) & " / " & modOutil.Txt(Sh.Range("B{SECTEUR}").Value) & " / " & _
            modOutil.Txt(Sh.Range("B{PHASE}").Value) & " -> note approuvée " & Sh.Range("B6").Text
        If Not Intersect(Target, Sh.Range("B{SECTEUR}")) Is Nothing Then modOutil.SecteurModifie Sh
    End If
Fin:
End Sub
'''

MOD_IA = r'''Option Explicit

' =====================================================================
'  Propositions de l'IA : import d'un fichier produit par l'outil web
'  (feuille « Propositions », format decrit dans l'onglet « Champs IA »).
'  Rien n'est ecrit dans le dossier sans acceptation : chaque proposition
'  passe par l'onglet « Revue IA » et chaque decision est tracee au Journal.
' =====================================================================

Private Const FEUILLE_PROPOSITIONS As String = "Propositions"
Private Const FORMAT_ATTENDU As String = "{FORMAT_IA}"
Private Const REV_PREMIERE As Long = {REV_FIRST}
Private Const COL_VALEUR As Long = 10   ' J : valeur convertie (masquee)
Private Const COL_TYPE As Long = 11     ' K : type du champ (masque)

Private Type Proposition
    Cle As String
    Valeur As Variant
    Source As String
    Confiance As String
End Type

Private mCodes(1 To 3) As String
Private mProps() As Proposition
Private mNb As Long

' ---------------------------------------------------------------------
'  Points d'entree
' ---------------------------------------------------------------------
Public Sub ImporterPropositionsIA()
    Dim ws As Worksheet, chemin As String
    Set ws = modOutil.DossierCible("Importer les propositions IA")
    If ws Is Nothing Then Exit Sub
    chemin = ChoisirFichier()
    If chemin = "" Then Exit Sub
    If Not LireFichier(chemin) Then Exit Sub
    PreparerRevue ws, chemin
End Sub

Public Sub NouveauDossierDepuisIA()
    Dim chemin As String, nom As String, ws As Worksheet
    chemin = ChoisirFichier()
    If chemin = "" Then Exit Sub
    If Not LireFichier(chemin) Then Exit Sub
    nom = mCodes(3)
    If nom = "" Then nom = "IA-" & mCodes(2)
    nom = Trim$(InputBox("Nom court du nouvel onglet :", "Nouveau dossier depuis l'IA", nom))
    If nom = "" Then Exit Sub
    If Not modOutil.NomValide(nom) Then Exit Sub
    Set ws = modOutil.CreerDossier(nom, "")
    If ws Is Nothing Then Exit Sub
    PreparerRevue ws, chemin
End Sub

' ---------------------------------------------------------------------
'  Lecture du fichier de propositions
' ---------------------------------------------------------------------
Private Function ChoisirFichier() As String
    Dim f As Variant
    f = Application.GetOpenFilename("Classeur Excel (*.xlsx;*.xlsm),*.xlsx;*.xlsm", , "Fichier de propositions de l'IA")
    If VarType(f) = vbBoolean Then Exit Function
    ChoisirFichier = CStr(f)
End Function

Private Function LireFichier(ByVal chemin As String) As Boolean
    Dim wbP As Workbook, wsP As Worksheet, r As Long, cle As String
    On Error GoTo Echec
    Application.ScreenUpdating = False
    Set wbP = Workbooks.Open(Filename:=chemin, ReadOnly:=True, UpdateLinks:=0, AddToMru:=False)
    On Error Resume Next
    Set wsP = wbP.Worksheets(FEUILLE_PROPOSITIONS)
    On Error GoTo Echec
    If wsP Is Nothing Then
        wbP.Close SaveChanges:=False
        Application.ScreenUpdating = True
        MsgBox "Le fichier ne contient pas de feuille « " & FEUILLE_PROPOSITIONS & " ».", vbExclamation, "Propositions IA"
        Exit Function
    End If
    If Left$(modOutil.Txt(wsP.Range("B1").Value), Len("PF-PROPOSITIONS-IA")) <> "PF-PROPOSITIONS-IA" Then
        wbP.Close SaveChanges:=False
        Application.ScreenUpdating = True
        MsgBox "Format non reconnu (cellule B1) : « " & FORMAT_ATTENDU & " » attendu.", vbExclamation, "Propositions IA"
        Exit Function
    End If
    mCodes(1) = modOutil.Txt(wsP.Range("B2").Value)
    mCodes(2) = NormaliserRadical(wsP.Range("B3").Value)
    mCodes(3) = UCase$(modOutil.Txt(wsP.Range("B4").Value))
    mNb = 0
    ReDim mProps(1 To 1)
    r = 9
    Do While modOutil.Txt(wsP.Cells(r, 1).Value) <> ""
        cle = modOutil.Txt(wsP.Cells(r, 1).Value)
        mNb = mNb + 1
        ReDim Preserve mProps(1 To mNb)
        mProps(mNb).Cle = cle
        If IsError(wsP.Cells(r, 2).Value) Then
            mProps(mNb).Valeur = Empty
        Else
            mProps(mNb).Valeur = wsP.Cells(r, 2).Value
        End If
        mProps(mNb).Source = modOutil.Txt(wsP.Cells(r, 3).Value)
        mProps(mNb).Confiance = modOutil.Txt(wsP.Cells(r, 4).Value)
        r = r + 1
    Loop
    wbP.Close SaveChanges:=False
    Application.ScreenUpdating = True
    If mCodes(1) = "" And mCodes(2) = "" And mCodes(3) = "" Then
        MsgBox "Le fichier ne porte ni code client, ni radical, ni code projet (cellules B2 à B4) : import refusé.", _
               vbExclamation, "Propositions IA"
        Exit Function
    End If
    If mNb = 0 Then
        MsgBox "Le fichier ne contient aucune proposition (à partir de la ligne 9).", vbExclamation, "Propositions IA"
        Exit Function
    End If
    LireFichier = True
    Exit Function
Echec:
    Application.ScreenUpdating = True
    MsgBox "Lecture du fichier impossible : " & Err.Description, vbExclamation, "Propositions IA"
End Function

Private Function NormaliserRadical(ByVal v As Variant) As String
    Dim s As String
    s = modOutil.Txt(v)
    If s <> "" And Len(s) < 7 And EstChiffres(s) Then s = Right$("0000000" & s, 7)
    NormaliserRadical = s
End Function

Private Function EstChiffres(ByVal s As String) As Boolean
    Dim i As Long
    If Len(s) = 0 Then Exit Function
    For i = 1 To Len(s)
        If Mid$(s, i, 1) < "0" Or Mid$(s, i, 1) > "9" Then Exit Function
    Next i
    EstChiffres = True
End Function

' ---------------------------------------------------------------------
'  Controle des codes et preparation de l'onglet « Revue IA »
' ---------------------------------------------------------------------
Private Sub PreparerRevue(ByVal ws As Worksheet, ByVal chemin As String)
    Dim wsR As Worksheet, libs As Variant, cellules As Variant, i As Long, cur As String, ecarts As String
    Dim controle As String, r As Long, k As Long, nbOk As Long, nbKo As Long, deja As Boolean

    libs = Array("code client T24", "radical", "code projet")
    cellules = Array(modOutil.CELLULE_CODE_CLIENT, modOutil.CELLULE_RADICAL, modOutil.CELLULE_CODE_PROJET)
    For i = 0 To 2
        cur = modOutil.Txt(ws.Range(cellules(i)).Value)
        If cur <> "" And mCodes(i + 1) <> "" And StrComp(cur, mCodes(i + 1), vbTextCompare) <> 0 Then
            ecarts = ecarts & "- " & libs(i) & " : dossier « " & cur & " », fichier « " & mCodes(i + 1) & " »" & vbCrLf
        End If
    Next i
    If ecarts <> "" Then
        MsgBox "Les codes du fichier ne correspondent pas à ceux du dossier « " & ws.Name & " » :" & vbCrLf & vbCrLf & _
               ecarts & vbCrLf & "Import refusé : vérifiez que le fichier concerne bien ce client et ce projet.", _
               vbCritical, "Propositions IA"
        modOutil.Journaliser "Import IA refusé", ws.Name, "Codes différents : " & Replace(ecarts, vbCrLf, " ")
        Exit Sub
    End If
    controle = "Codes conformes"
    For i = 0 To 2
        If modOutil.Txt(ws.Range(cellules(i)).Value) = "" Then controle = "Codes conformes ; codes vides du dossier proposés à la saisie"
    Next i

    Set wsR = ThisWorkbook.Worksheets(modOutil.ONGLET_REVUE)
    modOutil.Proteger wsR
    Application.ScreenUpdating = False
    r = REV_PREMIERE - 1 + Application.WorksheetFunction.CountA(wsR.Range("A" & REV_PREMIERE & ":A" & wsR.Rows.Count))
    If r >= REV_PREMIERE Then
        wsR.Range(wsR.Cells(REV_PREMIERE, 1), wsR.Cells(r, COL_TYPE)).Clear
    End If
    wsR.Range("B4").Value = "'" & ws.Name
    wsR.Range("B5").Value = "'" & chemin
    wsR.Range("B6").Value = controle
    wsR.Range("B7").Value = Format(Now, "dd/mm/yyyy hh:mm")

    r = REV_PREMIERE
    ' codes vides du dossier : proposes en tete, sauf s'ils figurent deja parmi les propositions
    For i = 0 To 2
        If modOutil.Txt(ws.Range(cellules(i)).Value) = "" And mCodes(i + 1) <> "" Then
            deja = False
            For k = 1 To mNb
                If StrComp(mProps(k).Cle, Array("code_client", "radical", "code_projet")(i), vbTextCompare) = 0 Then deja = True
            Next k
            If Not deja Then
                EcrireLigne wsR, r, ws, Array("code_client", "radical", "code_projet")(i), mCodes(i + 1), "Fichier de propositions (B" & (i + 2) & ")", "Élevée", nbOk, nbKo
                r = r + 1
            End If
        End If
    Next i
    For k = 1 To mNb
        EcrireLigne wsR, r, ws, mProps(k).Cle, mProps(k).Valeur, mProps(k).Source, mProps(k).Confiance, nbOk, nbKo
        r = r + 1
    Next k
    wsR.Columns(COL_VALEUR).Hidden = True
    wsR.Columns(COL_TYPE).Hidden = True
    Application.ScreenUpdating = True
    wsR.Activate
    wsR.Range("H" & REV_PREMIERE).Select
    modOutil.Journaliser "Import IA", ws.Name, (r - REV_PREMIERE) & " proposition(s) lue(s) dans " & chemin
    MsgBox (r - REV_PREMIERE) & " proposition(s) à examiner pour le dossier « " & ws.Name & " »." & vbCrLf & _
           nbOk & " préparée(s) pour acceptation, " & nbKo & " à rejeter (voir la colonne Remarque)." & vbCrLf & vbCrLf & _
           "Vérifiez chaque ligne, choisissez Accepter ou Rejeter en colonne H, puis cliquez « Appliquer les décisions ».", _
           vbInformation, "Propositions IA"
End Sub

' Une ligne de la revue : valeur actuelle, valeur proposee (en bleu), source, decision proposee.
Private Sub EcrireLigne(ByVal wsR As Worksheet, ByVal r As Long, ByVal ws As Worksheet, ByVal cle As String, _
                        ByVal valeur As Variant, ByVal source As String, ByVal confiance As String, _
                        ByRef nbOk As Long, ByRef nbKo As Long)
    Dim champ As Long, adr As String, typ As String, libelle As String, conv As Variant, remarque As String, ok As Boolean
    Dim actuel As String
    champ = LigneChamp(cle)
    wsR.Cells(r, 1).Value = "'" & cle
    wsR.Cells(r, 5).Value = "'" & modOutil.Txt(valeur)
    wsR.Cells(r, 5).Font.Color = RGB(0, 0, 255)
    wsR.Cells(r, 6).Value = "'" & source
    wsR.Cells(r, 7).Value = "'" & confiance
    If champ = 0 Then
        remarque = "Clé inconnue (voir l'onglet « Champs IA »)"
    Else
        libelle = modOutil.Txt(Plage("IA_Champs").Cells(champ, 2).Value)
        adr = modOutil.Txt(Plage("IA_Champs").Cells(champ, 3).Value)
        typ = modOutil.Txt(Plage("IA_Champs").Cells(champ, 4).Value)
        wsR.Cells(r, 2).Value = "'" & libelle
        wsR.Cells(r, 3).Value = "'" & adr
        actuel = modOutil.Txt(ws.Range(adr).Text)
        wsR.Cells(r, 4).Value = "'" & actuel
        ok = Convertir(typ, valeur, conv, remarque)
        If ok Then
            wsR.Cells(r, COL_VALEUR).Value = conv
            If VarType(conv) = vbString Then wsR.Cells(r, COL_VALEUR).Value = "'" & conv
            wsR.Cells(r, COL_TYPE).Value = "'" & typ
            If StrComp(modOutil.Txt(ws.Range(adr).Value), modOutil.Txt(conv), vbTextCompare) = 0 Then
                remarque = "Identique à la valeur actuelle"
                ok = False
            ElseIf actuel <> "" Then
                remarque = "Remplace une valeur saisie : à vérifier"
            End If
        End If
    End If
    With wsR.Cells(r, 8)
        .Value = IIf(ok, "Accepter", "Rejeter")
        .Locked = False
        .Interior.Color = RGB(255, 242, 204)
        .Validation.Delete
        .Validation.Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, Formula1:="Accepter,Rejeter"
    End With
    wsR.Cells(r, 9).Value = remarque
    wsR.Range(wsR.Cells(r, 1), wsR.Cells(r, 9)).Borders.LineStyle = xlContinuous
    wsR.Range(wsR.Cells(r, 1), wsR.Cells(r, 9)).WrapText = True
    If ok Then nbOk = nbOk + 1 Else nbKo = nbKo + 1
End Sub

' Plage nommee du classeur de l'outil (et non du classeur actif). RefersToRange echoue
' dans certains tableurs quand le nom de la feuille contient une espace : on relit alors
' la reference ='Feuille'!$A$1:$B$2.
Private Function Plage(ByVal nom As String) As Range
    Dim ref As String, p As Long, rg As Range
    On Error Resume Next
    Set rg = ThisWorkbook.Names(nom).RefersToRange
    On Error GoTo 0
    If rg Is Nothing Then
        ref = Mid$(ThisWorkbook.Names(nom).RefersTo, 2)
        p = InStrRev(ref, "!")
        Set rg = ThisWorkbook.Worksheets(Replace(Left$(ref, p - 1), "'", "")).Range(Mid$(ref, p + 1))
    End If
    Set Plage = rg
End Function

Private Function LigneChamp(ByVal cle As String) As Long
    Dim i As Long, champs As Range
    Set champs = Plage("IA_Champs")
    For i = 1 To champs.Rows.Count
        If StrComp(modOutil.Txt(champs.Cells(i, 1).Value), cle, vbTextCompare) = 0 Then
            LigneChamp = i
            Exit Function
        End If
    Next i
End Function

' ---------------------------------------------------------------------
'  Conversion et controle d'une valeur proposee selon le type du champ
' ---------------------------------------------------------------------
Private Function Convertir(ByVal typ As String, ByVal v As Variant, ByRef res As Variant, ByRef remarque As String) As Boolean
    Dim s As String, x As Double, nomListe As String, c As Range
    s = modOutil.Txt(v)
    If s = "" Then
        remarque = "Valeur vide"
        Exit Function
    End If
    If Left$(typ, 6) = "liste:" Then
        nomListe = Mid$(typ, 7)
        For Each c In Plage(nomListe).Cells
            If StrComp(modOutil.Txt(c.Value), s, vbTextCompare) = 0 Then
                res = c.Value
                Convertir = True
                Exit Function
            End If
        Next c
        remarque = "Valeur hors de la liste admise"
        Exit Function
    End If
    Select Case typ
        Case "nombre"
            If EnNombre(v, x) Then
                res = x: Convertir = True
            Else
                remarque = "Nombre attendu"
            End If
        Case "pourcentage"
            If EnNombre(v, x) Then
                If Right$(s, 1) = "%" Then x = x / 100
                If x < 0 Or x > 5 Then
                    remarque = "Pourcentage attendu en fraction (0,15 pour 15 %)"
                Else
                    res = x: Convertir = True
                End If
            Else
                remarque = "Pourcentage attendu (0,15 pour 15 %)"
            End If
        Case "radical"
            s = NormaliserRadical(v)
            If Len(s) = 7 And EstChiffres(s) Then
                res = s: Convertir = True
            Else
                remarque = "Le radical compte exactement 7 chiffres"
            End If
        Case "codeprojet"
            s = UCase$(s)
            If s Like "PF-####-####" Then
                res = s: Convertir = True
            Else
                remarque = "Format PF-AAAA-NNNN attendu"
            End If
        Case "code"
            If Len(s) <= 20 Then
                res = s: Convertir = True
            Else
                remarque = "20 caractères au plus"
            End If
        Case "situation"
            If Niveau(s) > 0 Then
                res = s: Convertir = True
            Else
                remarque = "Niveau attendu : Très favorable, Favorable, Vigilance, Critique ou Info. insuffisante"
            End If
        Case "texte ou nombre"
            If EnNombre(v, x) Then res = x Else res = s
            Convertir = True
        Case Else
            res = s: Convertir = True
    End Select
End Function

Private Function EnNombre(ByVal v As Variant, ByRef x As Double) As Boolean
    Dim s As String
    If IsError(v) Or IsEmpty(v) Then Exit Function
    Select Case VarType(v)
        Case vbDouble, vbSingle, vbInteger, vbLong, vbCurrency, vbDecimal
            x = CDbl(v): EnNombre = True: Exit Function
    End Select
    s = Replace(Replace(Trim$(CStr(v)), " ", ""), Chr$(160), "")
    If Right$(s, 1) = "%" Then s = Left$(s, Len(s) - 1)
    s = Replace(s, ",", ".")
    If s = "" Or s Like "*[!0-9.+-]*" Then Exit Function
    If Len(s) - Len(Replace(s, ".", "")) > 1 Then Exit Function
    x = Val(s)
    EnNombre = True
End Function

' Rang du niveau (1 Tres favorable ... 4 Critique, 5 Info. insuffisante), 0 si non reconnu.
Private Function Niveau(ByVal s As String) As Long
    Dim t As String
    t = LCase$(Trim$(s))
    If Left$(t, 14) = "très favorable" Or Left$(t, 14) = "tres favorable" Then
        Niveau = 1
    ElseIf Left$(t, 9) = "favorable" Then
        Niveau = 2
    ElseIf Left$(t, 9) = "vigilance" Then
        Niveau = 3
    ElseIf Left$(t, 8) = "critique" Then
        Niveau = 4
    ElseIf Left$(t, 4) = "info" Then
        Niveau = 5
    End If
End Function

' ---------------------------------------------------------------------
'  Application des decisions
' ---------------------------------------------------------------------
Public Sub AppliquerPropositionsIA()
    Dim wsR As Worksheet, ws As Worksheet, nom As String, r As Long, passe As Long, typ As String
    Dim nbA As Long, nbR As Long, dec As String, adr As String, ancien As String, v As Variant, idx As Variant
    Set wsR = ThisWorkbook.Worksheets(modOutil.ONGLET_REVUE)
    nom = modOutil.Txt(wsR.Range("B4").Value)
    If nom = "" Or Not modOutil.FeuilleExiste(nom) Then
        MsgBox "Aucune revue en cours : lancez d'abord « Importer les propositions IA ».", vbExclamation, "Propositions IA"
        Exit Sub
    End If
    Set ws = ThisWorkbook.Worksheets(nom)
    If Not modOutil.EstDossier(ws) Then
        MsgBox "« " & nom & " » n'est pas un onglet de dossier.", vbExclamation, "Propositions IA"
        Exit Sub
    End If
    If MsgBox("Appliquer les décisions au dossier « " & nom & " » ?" & vbCrLf & _
              "Les lignes « Accepter » seront écrites dans le dossier ; toutes les décisions sont tracées au Journal.", _
              vbYesNo + vbQuestion, "Propositions IA") <> vbYes Then Exit Sub

    On Error GoTo Echec
    Application.EnableEvents = False
    Application.ScreenUpdating = False
    modOutil.Proteger ws
    modOutil.Proteger wsR
    ' Passe 1 : tous les champs sauf les situations ; passe 2 : les situations, une fois le
    ' secteur ecrit (la description de D2.1, D4.1, D4.3 et D5.2 depend du secteur).
    For passe = 1 To 2
        If passe = 2 Then Application.Calculate
        r = REV_PREMIERE
        Do While modOutil.Txt(wsR.Cells(r, 1).Value) <> ""
            typ = modOutil.Txt(wsR.Cells(r, COL_TYPE).Value)
            dec = modOutil.Txt(wsR.Cells(r, 8).Value)
            If (passe = 1) = (typ <> "situation") Then
                adr = modOutil.Txt(wsR.Cells(r, 3).Value)
                If dec = "Accepter" And adr <> "" And typ <> "" Then
                    ancien = modOutil.Txt(ws.Range(adr).Text)
                    v = wsR.Cells(r, COL_VALEUR).Value
                    If typ = "situation" Then
                        idx = ws.Cells(ws.Range(adr).Row, 13).Value
                        If IsNumeric(idx) And Not IsEmpty(idx) Then
                            v = Plage("R_Opts").Cells(CLng(idx), Niveau(CStr(v))).Value
                        End If
                    End If
                    ws.Range(adr).Value = v
                    ws.Range(adr).ClearComments
                    ws.Range(adr).AddComment "Proposition IA acceptée le " & Format(Now, "dd/mm/yyyy") & vbLf & _
                        "Source : " & modOutil.Txt(wsR.Cells(r, 6).Value) & vbLf & _
                        "Confiance : " & modOutil.Txt(wsR.Cells(r, 7).Value)
                    modOutil.Journaliser "IA acceptée", nom, modOutil.Txt(wsR.Cells(r, 1).Value) & " : « " & ancien & _
                        " » -> « " & modOutil.Txt(ws.Range(adr).Text) & " » (" & modOutil.Txt(wsR.Cells(r, 6).Value) & ")"
                    wsR.Cells(r, 8).Value = "Appliquée"
                    nbA = nbA + 1
                ElseIf dec = "Rejeter" Then
                    modOutil.Journaliser "IA rejetée", nom, modOutil.Txt(wsR.Cells(r, 1).Value) & " : « " & _
                        modOutil.Txt(wsR.Cells(r, 5).Value) & " » (" & modOutil.Txt(wsR.Cells(r, 9).Value) & ")"
                    wsR.Cells(r, 8).Value = "Rejetée"
                    nbR = nbR + 1
                End If
            End If
            r = r + 1
        Loop
    Next passe
    Application.EnableEvents = True
    Application.ScreenUpdating = True
    Application.Calculate
    modOutil.MajSynthese False
    ws.Activate
    MsgBox nbA & " proposition(s) appliquée(s), " & nbR & " rejetée(s)." & vbCrLf & vbCrLf & _
           "Les cellules alimentées portent un commentaire indiquant la source. Complétez les cellules orange, " & _
           "puis « Contrôler la saisie ».", vbInformation, "Propositions IA"
    Exit Sub
Echec:
    Application.EnableEvents = True
    Application.ScreenUpdating = True
    MsgBox "Application interrompue (ligne " & r & ") : " & Err.Description, vbExclamation, "Propositions IA"
End Sub
'''
